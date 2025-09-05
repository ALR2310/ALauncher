import { zValidator } from '@hono/zod-validator';
import { addModRequestSchema, instanceSchema, toggleModRequestSchema } from '@shared/schema/instance.schema';
import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import throttle from 'lodash/throttle';

import { instanceService } from './instance.service';

export const instanceController = new Hono()
  .basePath('/instance')
  .get('/', async (c) => {
    const result = await instanceService.findAll();
    return c.json(result);
  })
  .get('/:id', async (c) => {
    const { id } = c.req.param();
    const result = await instanceService.findOne(id);
    return c.json(result);
  })
  .post('/', zValidator('json', instanceSchema), async (c) => {
    const instance = c.req.valid('json');
    const result = await instanceService.create(instance);
    return c.json(result);
  })
  .put('/:id', zValidator('json', instanceSchema), async (c) => {
    const { id } = c.req.param();
    const instance = c.req.valid('json');
    const result = await instanceService.update(id, instance);
    return c.json(result);
  })
  .delete('/:id', async (c) => {
    const { id } = c.req.param();
    const result = await instanceService.delete(id);
    return c.json(result);
  })
  .get('/:id/mod/:modId', zValidator('param', addModRequestSchema), async (c) => {
    const { id, modId } = c.req.valid('param');
    const downloader = await instanceService.addMod(id, modId);

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
  .delete('/:id/mod/:modId', zValidator('param', addModRequestSchema), async (c) => {
    const { id, modId } = c.req.valid('param');
    const result = await instanceService.removeMod(id, modId);
    return c.json(result);
  })
  .get('/:id/mod/:modId/can-remove', zValidator('param', addModRequestSchema), async (c) => {
    const { id, modId } = c.req.valid('param');
    const result = await instanceService.canRemoveMod(id, modId);
    return c.json(result);
  })
  .patch('/:id/mod', zValidator('json', toggleModRequestSchema), async (c) => {
    const { id } = c.req.param();
    const { modIds, enabled } = c.req.valid('json');
    const result = await instanceService.toggleMods(id, modIds, enabled);
    return c.json(result);
  });
