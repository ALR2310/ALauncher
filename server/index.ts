import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();

console.log('path file: ', process.execPath);

app.use(
  '*',
  cors({
    origin: '*',
    allowHeaders: ['*'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
  }),
);

app.get('/', (c) =>
  c.json({
    message: 'Xin chào từ Hono!',
    author: 'An',
  }),
);

serve(
  {
    fetch: app.fetch,
    port: 8787,
  },
  (info) => {
    console.log(`Listening on http://localhost:${info.port}`);
  },
);
