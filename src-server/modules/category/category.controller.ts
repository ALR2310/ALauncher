import { Hono } from 'hono';

import { categoriesService } from './category.service';

export const categoriesController = new Hono().basePath('/category').get('/', async (c) => {
  const payload: any = c.req.query();
  const result = await categoriesService.findAll(payload);
  return c.json(result);
});
