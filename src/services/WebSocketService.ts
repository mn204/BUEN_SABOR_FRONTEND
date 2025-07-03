import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

const socketUrl = 'http://localhost:8080/ws'; 

export function connectWebSocket(
  topic: string,
  onMessage: (pedido: any) => void
) {
  const stompClient = new Client({
    webSocketFactory: () => new SockJS(socketUrl),
    reconnectDelay: 5000,
    onConnect: () => {
      console.log(`📡 Conectado al WebSocket: ${topic}`);
      stompClient.subscribe(topic, message => {
        const pedido = JSON.parse(message.body);
        onMessage(pedido);
      });
    },
    onStompError: error => {
      console.error('WebSocket error:', error);
    }
  });

  stompClient.activate();
  return stompClient;
}