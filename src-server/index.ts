import 'dotenv/config';
import 'reflect-metadata';

import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { trimTrailingSlash } from 'hono/trailing-slash';

import { exception } from './common/filters/exception.filter';
import { registerController } from './common/register-controller';
import { CategoryController } from './modules/category/category.controller';
import { ContentController } from './modules/content/content.controller';
import { InstanceController } from './modules/instance/instance.controller';
import { LauncherController } from './modules/launcher/launcher.controller';
import { VersionController } from './modules/version/version.controller';

const app = new Hono()
  .basePath('/api')
  .onError(exception)
  .use(cors({ origin: '*' }))
  .use(logger())
  .use(trimTrailingSlash());
registerController(app, [
  CategoryController,
  ContentController,
  InstanceController,
  LauncherController,
  VersionController,
]);

serve({ fetch: app.fetch, port: Number(process.env.VITE_SERVER_PORT ?? 1421) }, (info) => {
  console.log(`Listening on http://localhost:${info.port}`);
});
