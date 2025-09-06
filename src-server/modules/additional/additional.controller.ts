import { zValidator } from '@hono/zod-validator';
import { additionalQuerySchema } from '@shared/schema/additional.schema';
import { Hono } from 'hono';

import { additionalService } from './additional.service';

export const additionalController = new Hono()
  .basePath('/additional')
  .get('/', zValidator('query', additionalQuerySchema), async (c) => {
    const payload = c.req.valid('query');
    const result = await additionalService.searchMods(payload);
    return c.json(result);
  });
