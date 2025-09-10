import { Hono } from 'hono';

import { versionService } from './version.service';

export const versionController = new Hono()
  .basePath('version')
  .get('/', async (c) => {
    const result = await versionService.findAll();
    return c.json(result);
  })
  .get('/release', async (c) => {
    const result = await versionService.getReleaseVersions();
    return c.json(result);
  })
  .get('/loader', async (c) => {
    const payload: any = c.req.query();
    const result = await versionService.getLoaderVersions(payload);
    return c.json(result);
  })
  .get('/note', async (c) => {
    const payload: any = c.req.query();
    const result = await versionService.getReleaseNote(payload);
    return c.json(result);
  });
