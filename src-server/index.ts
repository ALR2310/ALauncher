import { config } from 'dotenv';
import { WebSocket, WebSocketServer } from 'ws';

config();

interface WSRequest {
  action: string;
  payload?: any;
}

interface WSResponse {
  action: string;
  data: any;
}

type WSHandler = (ws: WebSocket, payload?: any) => void;
const handlers: Record<string, WSHandler> = {};

function on(action: string, handler: WSHandler) {
  handlers[action] = handler;
}

function send(ws: WebSocket, action: string, data: any) {
  const response: WSResponse = { action, data };
  ws.send(JSON.stringify(response));
}

const wss = new WebSocketServer({ port: Number(process.env.VITE_WS_PORT) });

wss.on('connection', (ws: WebSocket) => {
  ws.on('message', (message: Buffer) => {
    try {
      const { action, payload } = JSON.parse(message.toString()) as WSRequest;

      if (handlers[action]) {
        handlers[action](ws, payload);
      } else {
        console.warn(`cannot find handler for action: ${action}`);
      }
    } catch (err) {
      console.error(err);
    }
  });
});

// ----------------------
// Define handlers
// ----------------------
on('username', (ws, payload?: any) => {
  console.log('server nhận được:', payload);
  send(ws, 'username', { status: 'ok', received: payload });
});

console.log('WS Server started on port 8787');
