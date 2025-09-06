import 'dotenv/config';

import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

import { exceptionMiddleware } from './middlewares/exception';
import { additionalController } from './modules/additional/additional.controller';
import { categoriesController } from './modules/category/category.controller';
import { instanceController } from './modules/instance/instance.controller';
import { launcherController } from './modules/launcher/launcher.controller';
import { versionController } from './modules/version/version.controller';

const app = new Hono().basePath('/api').onError(exceptionMiddleware);

app.use('*', cors({ origin: '*' }));
app.use('*', logger());

app.route('/', launcherController);
app.route('/', versionController);
app.route('/', instanceController);
app.route('/', categoriesController);
app.route('/', additionalController);

serve({ fetch: app.fetch, port: Number(process.env.VITE_SERVER_PORT ?? 1421) }, (info) => {
  console.log(`Listening on http://localhost:${info.port}`);
});
