import { serve } from '@hono/node-server';
import { config } from 'dotenv';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

import instanceController from './controllers/instanceController';
import launcherController from './controllers/launcherController';
import versionController from './controllers/versionController';

config({ quiet: true });

const app = new Hono();

app.use('*', cors({ origin: '*' }));
app.use('*', logger());

// Routes
app.route('/launcher', launcherController);
app.route('/versions', versionController);
app.route('/instances', instanceController);

serve({ fetch: app.fetch, port: Number(process.env.VITE_SERVER_PORT ?? 1421) }, (info) => {
  console.log(`Listening on http://localhost:${info.port}`);
});
