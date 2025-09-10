import { ContentQuery } from '@shared/schemas/content.schema';
import { Hono } from 'hono';

import { contentService } from './content.service';

export const contentController = new Hono().basePath('/content').get('/', async (c) => {
  const payload = c.req.query() as any as ContentQuery;
  const result = await contentService.findAll(payload);
  return c.json(result);
});
