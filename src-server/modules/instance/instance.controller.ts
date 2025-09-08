import { zValidator } from '@hono/zod-validator';
import { instanceSchema } from '@shared/schema/instance.schema';
import { Hono } from 'hono';

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
  });
