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
    const { version, type } = c.req.query();
    const result = await versionService.getLoaderVersions(version, type);
    return c.json(result);
  }).get('/note', async(c)=> {
    const { pageIndex = '0', pageSize = '1' } = c.req.query();
    const result = await versionService.getReleaseNote(Number(pageIndex), Number(pageSize));
    return c.json(result);
  })
