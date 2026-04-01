import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Client } from '@stomp/stompjs';
import toast from 'react-hot-toast';
import { addNotification, syncMissedNotifications, fetchInitialNotifications } from './notificationsSlice';
import { RootState, AppDispatch } from '../../app/layout/store';
import { store } from '../../app/layout/store';

export const useNotificationSocket = () => {
    const dispatch = useDispatch<AppDispatch>();
    const notifications = useSelector((state: RootState) => state.notifications.items);
    // Assuming you have access to userId somehow, or just letting the auth token decide.
    // If user info is not globally available in store yet, we just grab token.
    const token = localStorage.getItem('token') || localStorage.getItem('access_token');
    // The server maps the current user by the token in the headers, or we might need the exact userId
    // Let's assume the WebSocket maps it securely behind the scenes using the token from the cookie or headers.

    const clientRef = useRef<Client | null>(null);

    useEffect(() => {
        // Fetch initial notifications first
        if (token) {
            dispatch(fetchInitialNotifications());
        }
    }, [dispatch, token]);

    useEffect(() => {
        if (!token) return;

        // Note: adjust the backend url depending on proxy setup. Vite usually proxies /api
        // Here we hit the raw backend port. Assuming it's 8080 or let vite proxy /ws if setup.
        // It's safer to use absolute or relative depending on vite.config.ts. Let's assume standard config
        const socketUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8081/ws';

        const client = new Client({
            brokerURL: socketUrl,
            connectHeaders: {
                Authorization: `Bearer ${token}`
            },
            reconnectDelay: 5000,
            onConnect: () => {
                console.log('Connected to STOMP for notifications');

                // Subscribe to user queue
                client.subscribe(`/user/queue/notifications`, (message) => {
                    const incomingNotification = JSON.parse(message.body);

                    // Check if it's already in our Redux store
                    const currentState = store.getState();
                    const isAlreadyInStore = currentState.notifications.items.some(
                        (n: any) => n.id === incomingNotification.id
                    );

                    // Dispatch to state to update UI badge and list
                    dispatch(addNotification(incomingNotification));

                    // Keep track of shown toasts to NEVER duplicate popups
                    let toastedIds: number[] = [];
                    try {
                        const stored = localStorage.getItem('toasted_notifications');
                        if (stored) toastedIds = JSON.parse(stored);
                    } catch(e) {}

                    if (!isAlreadyInStore && !toastedIds.includes(incomingNotification.id)) {
                        toastedIds.push(incomingNotification.id);
                        if (toastedIds.length > 100) toastedIds.shift(); // Keep limit
                        localStorage.setItem('toasted_notifications', JSON.stringify(toastedIds));

                        // Show a toast
                        const senderName = incomingNotification.sender?.username || 'Someone';
                        let text = `New notification from ${senderName}`;
                        switch(incomingNotification.type) {
                          case 'LIKE_POST': text = `${senderName} liked your post.`; break;
                          case 'LIKE_COMMENT': text = `${senderName} liked your comment.`; break;
                          case 'NEW_COMMENT': text = `${senderName} commented on your post.`; break;
                          case 'NEW_MESSAGE': text = `${senderName} sent you a message.`; break;
                          case 'GROUP_INVITE': text = `${senderName} invited you to a group.`; break;
                          case 'FOLLOW': text = `${senderName} started following you.`; break;
                        }

                        toast.success(text, {
                           icon: '🔔',
                           duration: 4000,
                           position: 'bottom-right'
                        });
                    }
                });

                // Request sync for anything missed
                // We grab the max ID from our currently loaded items.
                const currentState = store.getState();
                const lastId = currentState.notifications.items.length > 0
                    ? Math.max(...currentState.notifications.items.map((n: any) => n.id))
                    : 0;
                client.publish({
                    destination: '/app/notifications.sync',
                    body: JSON.stringify({ lastMessageId: lastId })
                });
            },
            onStompError: (frame) => {
                console.error('Broker reported error: ' + frame.headers['message']);
            }
        });

        client.activate();
        clientRef.current = client;

        return () => {
            if (clientRef.current) {
                clientRef.current.deactivate();
            }
        };
    }, []); // Run once on component mount for connection establishment

    return clientRef.current;
};