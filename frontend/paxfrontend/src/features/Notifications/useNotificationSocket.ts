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
    const token = localStorage.getItem('token') || localStorage.getItem('access_token');

    const clientRef = useRef<Client | null>(null);

    useEffect(() => {
        if (token) {
            dispatch(fetchInitialNotifications());
        }
    }, [dispatch, token]);

    useEffect(() => {
        if (!token) return;

        const socketUrl = import.meta.env.VITE_WS_URL || `${import.meta.env.VITE_WS_URL}/ws`;

        const client = new Client({
            brokerURL: socketUrl,
            connectHeaders: {
                Authorization: `Bearer ${token}`
            },
            reconnectDelay: 5000,
            onConnect: () => {
                console.log('Connected to STOMP for notifications');

                client.subscribe(`/user/queue/notifications`, (message) => {
                    const incomingNotification = JSON.parse(message.body);

                    const currentState = store.getState();
                    const isAlreadyInStore = currentState.notifications.items.some(
                        (n: any) => n.id === incomingNotification.id
                    );

                    dispatch(addNotification(incomingNotification));

                    let toastedIds: number[] = [];
                    try {
                        const stored = localStorage.getItem('toasted_notifications');
                        if (stored) toastedIds = JSON.parse(stored);
                    } catch(e) {}

                    if (!isAlreadyInStore && !toastedIds.includes(incomingNotification.id)) {
                        toastedIds.push(incomingNotification.id);
                        if (toastedIds.length > 100) toastedIds.shift();
                        localStorage.setItem('toasted_notifications', JSON.stringify(toastedIds));

                        const senderName = incomingNotification.sender?.username || 'Someone';
                        let text = `New notification from ${senderName}`;
                        switch(incomingNotification.type) {
                          case 'LIKE_POST': text = `${senderName} liked your post.`; break;
                          case 'LIKE_COMMENT': text = `${senderName} liked your comment.`; break;
                          case 'NEW_COMMENT': text = `${senderName} commented on your post.`; break;
                          case 'NEW_MESSAGE': text = `${senderName} sent you a message.`; break;
                          case 'GROUP_INVITE': text = `${senderName} invited you to a group.`; break;
                          case 'FOLLOW': text = `${senderName} started following you.`; break;
                          case 'FRIEND_REQUEST': text = `${senderName} sent you a friend request.`; break;
                          case 'FRIEND_ACCEPTED': text = `${senderName} accepted your friend request.`; break;
                        }

                        toast.success(text, {
                           icon: '🔔',
                           duration: 4000,
                           position: 'bottom-right'
                        });
                    }
                });

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
    }, []);

    return clientRef.current;
};