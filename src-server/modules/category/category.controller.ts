import { Hono } from 'hono';

import { categoriesService } from './category.service';

export const categoriesController = new Hono().basePath('/category').get('/', async (c) => {
  const { classId, classesOnly } = c.req.query();
  const result = await categoriesService.findAll(Number(classId), classesOnly === 'true');
  return c.json(result);
});
