import { Client } from "@stomp/stompjs";

let client: Client | null = null;

export const connectSocket = (token: string, onMessage: (msg:any)=>void) => {

    client = new Client({
        brokerURL: `${import.meta.env.VITE_WS_URL}/ws`,
        connectHeaders: {
            Authorization: `Bearer ${token}`
        },
        debug: () => {},
        reconnectDelay: 5000
    });

    client.onConnect = () => {
        client?.subscribe("/user/queue/messages", message => {
            onMessage(JSON.parse(message.body));
        });
    };

    client.activate();
};

export const sendMessage = (payload:any) => {
    client?.publish({
        destination: "/app/chat.send",
        body: JSON.stringify(payload)
    });
};