import { spawn } from 'child_process';
import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import throttle from 'lodash/throttle';
import path from 'path';

import { launcherService } from '~s/services/launcherService';

const launcherController = new Hono();

export default launcherController
  .get('config', async (c) => {
    const config = await launcherService.getConfig();
    return c.json(config);
  })
  .post('config', async (c) => {
    const { key, value } = await c.req.json();
    const config = await launcherService.setConfig(key, value);
    return c.json(config);
  })
  .get('launch', async (c) => {
    const DELAY = 500;
    const launch = await launcherService.launch();

    if (!launch) {
      return c.json({ error: 'Cannot start launcher' }, 409);
    }

    return streamSSE(c, async (stream) => {
      const done = new Promise<void>((resolve) => {
        launch
          .on(
            'progress',
            throttle(async (p, s) => {
              const percent = ((p / s) * 100).toFixed(2);
              await stream.writeSSE({ event: 'progress', data: percent });
            }, DELAY),
          )
          .on(
            'log',
            throttle(async (line) => {
              console.log('Log:', line);
              await stream.writeSSE({ event: 'log', data: line });
            }, DELAY),
          )
          .on(
            'speed',
            throttle(async (s) => {
              const speedMB = (s / 1024 / 1024).toFixed(2);
              await stream.writeSSE({ event: 'speed', data: `${speedMB}MB/s` });
            }, DELAY),
          )
          .on(
            'estimated',
            throttle(async (t) => {
              const m = Math.floor(t / 60);
              const s = Math.floor(t % 60);
              await stream.writeSSE({ event: 'estimated', data: `${m}m ${s}s` });
            }, DELAY),
          )
          .on(
            'extract',
            throttle(async (e) => await stream.writeSSE({ event: 'extract', data: e }), DELAY),
          )
          .on(
            'patch',
            throttle(async (e) => await stream.writeSSE({ event: 'patch', data: e }), DELAY),
          )
          .on('error', async (err) => {
            console.error('Error launching:', err);
            await stream.writeSSE({ event: 'error', data: err.message });
            await stream.close();
            resolve();
          })
          .on('close', async () => {
            await stream.writeSSE({ event: 'close', data: 'Launch closed' });
            await stream.close();
            resolve();
          })
          .on('cancelled', async () => {
            await stream.writeSSE({ event: 'cancelled', data: 'Launch cancelled' });
            await stream.close();
            resolve();
          });
      });

      await done;
    });
  })
  .get('cancel', (c) => {
    launcherService.cancel();
    return c.json({ success: true });
  })
  .get('openFolder', async (c) => {
    const folderPath = path.resolve((await launcherService.getConfig()).minecraft.gamedir);
    const platform = process.platform;

    if (platform === 'win32') spawn('explorer', [folderPath]);
    else if (platform === 'darwin') spawn('open', [folderPath]);
    else spawn('xdg-open', [folderPath]);

    return c.json({ success: true });
  });
