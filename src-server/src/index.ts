import 'reflect-metadata';

import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { readFile } from 'fs/promises';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { trimTrailingSlash } from 'hono/trailing-slash';

import { exception } from './common/filters/exception.filter';
import { registerController } from './common/register-controller';
import { AppController } from './modules/app/app.controller';
import { CategoryController } from './modules/category/category.controller';
import { ContentController } from './modules/content/content.controller';
import { InstanceController } from './modules/instance/instance.controller';
import { LauncherController } from './modules/launcher/launcher.controller';
import { VersionController } from './modules/version/version.controller';
import { WorldController } from './modules/world/world.controller';

const server = new Hono()
  .basePath('/api')
  .onError(exception)
  .use(cors({ origin: '*' }))
  .use(logger())
  .use(trimTrailingSlash());
registerController(server, [
  CategoryController,
  ContentController,
  InstanceController,
  LauncherController,
  VersionController,
  WorldController,
  AppController,
]);

serve({ fetch: server.fetch, port: Number(process.env.VITE_SERVER_PORT ?? 1421) }, (info) => {
  console.log(`Server listening on http://localhost:${info.port}`);
});

if (process.env.NODE_ENV !== 'development') {
  const client = new Hono().use('/*', serveStatic({ root: '.' })).get('*', async (c) => {
    const buf = await readFile('./entry.bin', 'utf8');
    return c.body(buf, 200, {
      'Content-Type': 'text/html; charset=utf-8',
    });
  });

  serve({ fetch: client.fetch, port: 1420 }, (info) => {
    console.log(`Client listening on http://localhost:${info.port}`);
  });
}
