import '~/configs/env.config';
import 'reflect-metadata';
import '@shared/utils/zod.utils';

import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { trimTrailingSlash } from 'hono/trailing-slash';

import { controllerRegister } from './common/controller.register';
import { exception } from './common/filters/exception.filter';
import { renderGUI } from './common/middlewares/gui.render';
import { createRateLimiter } from './common/middlewares/rate.limiter';
import { AppController } from './modules/app/app.controller';
import { CategoryController } from './modules/category/category.controller';
import { ContentController } from './modules/content/content.controller';
import { InstanceController } from './modules/instance/instance.controller';
import { VersionController } from './modules/version/version.controller';

const app = new Hono()
  .use(cors({ origin: '*' }))
  .use(logger())
  .use(trimTrailingSlash())
  .use(createRateLimiter())
  .use(serveStatic({ root: '.' }))
  .use(renderGUI)
  .onError(exception);
controllerRegister(app.basePath('/api'), [
  AppController,
  CategoryController,
  ContentController,
  InstanceController,
  VersionController,
]);

serve({ fetch: app.fetch, port: Number(process.env.VITE_PORT ?? 2310) }, (info) => {
  console.log(`App listening on http://localhost:${info.port}`);
});
