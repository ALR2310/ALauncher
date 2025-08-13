import { WSRequest, WSResponse } from '@shared/ws.type';
import crypto from 'crypto';
import { WebSocket, WebSocketServer } from 'ws';

type WSHandler = (payload?: any) => void;

const handlers: Record<string, WSHandler> = {};
const clients = new Set<WebSocket>();

export function on(action: string, handler: WSHandler) {
  handlers[action] = handler;
}

export function send(action: string, data: any) {
  const id = crypto.randomUUID();
  const message: WSResponse = { id, action, data };
  const json = JSON.stringify(message);
  clients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(json);
    }
  });
}

export function startServer(port: number) {
  const wss = new WebSocketServer({ port });

  wss.on('connection', (ws: WebSocket) => {
    clients.add(ws);

    ws.on('message', (message: Buffer) => {
      try {
        const { action, payload } = JSON.parse(message.toString()) as WSRequest;
        if (handlers[action]) {
          handlers[action](payload);
        } else {
          console.warn(`No handler for action: ${action}`);
        }
      } catch (err) {
        console.error('Invalid WS message', err);
      }
    });

    ws.on('close', () => {
      clients.delete(ws);
    });
  });

  console.log(`WebSocket server running at ws://localhost:${port}`);
}
