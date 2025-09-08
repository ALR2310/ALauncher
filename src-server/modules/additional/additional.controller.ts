import { zValidator } from '@hono/zod-validator';
import { additionalQuerySchema } from '@shared/schema/additional.schema';
import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import throttle from 'lodash/throttle';

import { additionalService } from './additional.service';

export const additionalController = new Hono()
  .basePath('/additional')
  .get('/', zValidator('query', additionalQuerySchema), async (c) => {
    const payload = c.req.valid('query');
    const result = await additionalService.searchMods(payload);
    return c.json(result);
  })
  .get('/:id', async (c) => {
    const { id } = c.req.param();
    const { instanceId, type } = c.req.query();

    const downloader = await additionalService.downloadAdditional({ id, instanceId, type } as any);
    if (!downloader) return c.json({ message: 'Mod already added or not found' });

    return streamSSE(c, async (stream) => {
      const DELAY = 500;
      const done = new Promise<void>((resolve) => {
        downloader
          .on(
            'progress',
            throttle(async (p, s) => {
              const percent = ((p / s) * 100).toFixed(2);

              if (percent === '100.00') {
                await stream.writeSSE({ event: 'done', data: 'Download complete' });
                await stream.close();
                resolve();
              }

              await stream.writeSSE({ event: 'progress', data: percent });
            }, DELAY),
          )
          .on('error', async (err) => {
            await stream.writeSSE({ event: 'error', data: JSON.stringify(err) });
            await stream.close();
            resolve();
          });
      });

      await done;
    });
  })
  .delete('/:id', async (c) => {
    const { id } = c.req.param();
    const { instanceId, type } = c.req.query();

    const result = await additionalService.removeAdditional({ id, instanceId, type } as any);
    return c.json(result);
  })
  .get('/:id/can-remove', async (c) => {
    const { id } = c.req.param();
    const { instanceId } = c.req.query();

    const result = await additionalService.canRemoveAdditional({ id, instanceId } as any);
    return c.json(result);
  })
  .post('/toggle', async (c) => {
    const payload = await c.req.json();
    const result = await additionalService.toggleAdditional(payload);
    return c.json(result);
  });
