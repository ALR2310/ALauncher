import { spawn } from 'child_process';
import { config } from 'dotenv';
import fs from 'fs';
import throttle from 'lodash/throttle';
import path from 'path';

import { appConfig } from './services/appConfig';
import { cancel, launch } from './services/launcher';
import { on, send, startServer } from './services/wss';

config({ quiet: true });

startServer(process.env.VITE_WS_PORT ? parseInt(process.env.VITE_WS_PORT) : 8787);

on('launcher:config', (payload?: { key: string; value?: any }) => {
  const { key, value } = payload ? payload : { key: undefined, value: undefined };
  const configs = appConfig(key, value);
  send('launcher:config', configs);
});

on('launcher:launch', async () => {
  try {
    const game = await launch();

    game.on(
      'progress',
      throttle((p, s) => {
        const percent = ((p / s) * 100).toFixed(2);
        send('launcher:progress', percent);
      }, 500),
    );
    game.on(
      'log',
      throttle((line) => {
        send('launcher:log', line);
      }, 500),
    );
    game.on(
      'speed',
      throttle((s) => {
        const speedMB = (s / 1024 / 1024).toFixed(2);
        send('launcher:speed', `${speedMB}MB/s`);
      }, 500),
    );
    game.on(
      'estimated',
      throttle((t) => {
        const m = Math.floor(t / 60);
        const s = Math.floor(t % 60);
        send('launcher:estimated', `${m}m ${s}s`);
      }, 500),
    );
    game.on(
      'extract',
      throttle((e) => send('launcher:extract', e), 500),
    );
    game.on(
      'patch',
      throttle((e) => send('launcher:patch', e), 500),
    );
    game.on('close', () => send('launcher:close', true));
    game.on('error', (err) => {
      console.error('Error launching:', err);
      send('launcher:error', err);
    });
  } catch (e) {
    console.error('Error launching:', e);
    send('launcher:error', e);
  }
});

on('launcher:cancel', () => {
  try {
    const result = cancel();
    send('launcher:cancel', result);
  } catch (e) {
    console.error('Error cancelling launch:', e);
  }
});

on('version:downloaded', () => {
  const versionsPath = path.resolve(appConfig('minecraft.gamedir') as any, 'versions');
  const dirs = fs
    .readdirSync(versionsPath, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);
  send('version:downloaded', dirs);
});

on('app:openFolder', () => {
  const folderPath = path.resolve(appConfig('minecraft.gamedir') as any);
  const platform = process.platform;

  if (platform === 'win32') spawn('explorer', [folderPath]);
  else if (platform === 'darwin') spawn('open', [folderPath]);
  else spawn('xdg-open', [folderPath]);
});
