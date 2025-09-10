import {
  InstanceAddContentQuery,
  InstanceRemoveContentQuery,
  InstanceToggleContentPayload,
} from '@shared/schemas/instance.schema';
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
  .post('/', async (c) => {
    const instance = await c.req.json();
    const result = await instanceService.create(instance);
    return c.json(result);
  })
  .put('/:id', async (c) => {
    const payload = { ...c.req.param(), ...(await c.req.json()) };
    const result = await instanceService.update(payload);
    return c.json(result);
  })
  .delete('/:id', async (c) => {
    const { id } = c.req.param();
    const result = await instanceService.delete(id);
    return c.json(result);
  })
  .get('/:id/:type/:contentId', async (c) => {
    const payload = { ...c.req.param(), ...c.req.query() } as any as InstanceAddContentQuery;
    const downloader = await instanceService.addContent(payload);

    if (!downloader) {
      return streamSSE(c, async (stream) => {
        await stream.writeSSE({ event: 'done', data: 'Already installed' });
        await stream.close();
      });
    }

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
  .delete('/:id/:type/:contentId', async (c) => {
    const payload = { ...c.req.param(), ...c.req.query() } as any as InstanceRemoveContentQuery;
    const result = await instanceService.removeContent(payload);
    return c.json(result);
  })
  .get('/:id/:type/:contentId/can-remove', async (c) => {
    const payload = { ...c.req.param() } as any as InstanceRemoveContentQuery;
    const result = await instanceService.canRemoveContent(payload);
    return c.json(result);
  })
  .post('/:id/:type/toggle', async (c) => {
    const payload = { ...c.req.param(), ...(await c.req.json()) } as any as InstanceToggleContentPayload;
    const result = await instanceService.toggleContent(payload);
    return c.json(result);
  });
