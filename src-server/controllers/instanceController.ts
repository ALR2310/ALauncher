import { InstanceMeta } from '@shared/launcher.type';
import { Hono } from 'hono';

import { instanceService } from '~s/services/instancesService';

const instanceController = new Hono();

export default instanceController
  .get('/', async (c) => {
    const { slug } = c.req.query();
    const instances = await instanceService.get(slug);
    return c.json(instances);
  })
  .post('/', async (c) => {
    const instance: InstanceMeta = await c.req.json();
    const result = await instanceService.create(instance);
    return c.json(result);
  })
  .put('/:slug', async (c) => {
    const { slug } = c.req.param();
    const instance = await c.req.json();
    const result = await instanceService.update(slug, instance);
    return c.json(result);
  })
  .delete('/:slug', async (c) => {
    const { slug } = c.req.param();
    const result = await instanceService.delete(slug);
    return c.json(result);
  })
  .post('/:slug/mods', async (c) => {
    const { slug } = c.req.param();
    const { mods } = await c.req.json();
    const result = await instanceService.addMods(slug, mods);
    return c.json(result);
  })
  .delete('/:slug/mods', async (c) => {
    const { slug } = c.req.param();
    const { ids } = await c.req.json();
    const result = await instanceService.removeMods(slug, ids);
    return c.json(result);
  });
