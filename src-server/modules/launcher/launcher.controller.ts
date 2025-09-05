import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';

import { launcherService } from './launcher.service';

export const launcherController = new Hono()
  .basePath('launcher')
  .get('/config', async (c) => {
    const result = await launcherService.getConfig();
    return c.json(result);
  })
  .post('/config', async (c) => {
    const { key, value } = await c.req.json();
    const result = await launcherService.setConfig(key, value);
    return c.json(result);
  })
  .get('/folder', async (c) => {
    const result = await launcherService.getFolder();
    return c.json(result);
  })
  .get('/launch', async (c) => {
    const launch = await launcherService.launch();

    if (!launch) {
      return c.json({ success: false, message: 'Cannot launch another instance' }, 500);
    }

    return streamSSE(c, async (stream) => {
      const done = new Promise<void>((resolve) =>
        launch
          .on('progress', async (p) => await stream.writeSSE({ event: 'progress', data: p }))
          .on('log', async (l) => await stream.writeSSE({ event: 'log', data: l }))
          .on('speed', async (s) => await stream.writeSSE({ event: 'speed', data: s }))
          .on('estimated', async (e) => await stream.writeSSE({ event: 'estimated', data: e }))
          .on('extract', async (e) => await stream.writeSSE({ event: 'extract', data: e }))
          .on('patch', async (p) => await stream.writeSSE({ event: 'patch', data: p }))
          .on('close', async () => {
            await stream.writeSSE({ event: 'close', data: 'Launch closed' });
            await stream.close();
            resolve();
          })
          .on('cancelled', async () => {
            await stream.writeSSE({ event: 'cancelled', data: 'Launch cancelled' });
            await stream.close();
            resolve();
          })
          .on('error', async (err) => {
            await stream.writeSSE({ event: 'error', data: JSON.stringify(err) });
            await stream.close();
            resolve();
          }),
      );

      await done;
    });
  })
  .get('/cancel', async (c) => {
    const result = launcherService.cancel();
    return c.json({ success: result });
  });
