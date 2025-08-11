import { config } from 'dotenv';
import { WebSocket, WebSocketServer } from 'ws';

import { appConfig } from './services/appConfig';
import { launch } from './services/launcher';

config({ quiet: true });
appConfig();

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

const wss = new WebSocketServer({ port: Number(process.env.VITE_WS_PORT) || 8787 });

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

on('appConfig', (ws, payload?: { key: string; value: any }) => {
  const { key, value } = payload ? payload : { key: undefined, value: undefined };

  const configs = appConfig(key, value);
  send(ws, 'appConfig', configs);
});

on('launcher_play', async (ws) => {
  try {
    const game = await launch();

    game.on('progress', (p, s) => {
      const percent = ((p / s) * 100).toFixed(2);
      send(ws, 'launcher_progress', percent);
    });
    game.on('log', (line) => {
      send(ws, 'launcher_log', line);
    });
    game.on('speed', (s) => {
      const speedMB = (s / 1024 / 1024).toFixed(2);
      send(ws, 'launcher_speed', `${speedMB}MB/s`);
    });
    game.on('estimated', (t) => {
      const m = Math.floor(t / 60);
      const s = t % 60;
      send(ws, 'launcher_estimated', `${m}m ${s}s`);
    });
    game.on('extract', (e) => console.log('extract', e));
    game.on('close', () => send(ws, 'launcher_close', true));
    game.on('error', (err) => console.error(err));
  } catch (e) {
    console.log(e);
  }
});

console.log('WS Server started on port 8787');
