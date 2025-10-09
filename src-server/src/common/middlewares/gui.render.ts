import { readFile } from 'fs/promises';
import { Context, Next } from 'hono';

let cached: string | null = null;
const isDev = process.env.NODE_ENV === 'development';

export const renderGUI = async (c: Context, next: Next) => {
  const isApi = c.req.path.startsWith('/api');
  if (isApi || isDev) return next();
  if (!cached) cached = await readFile('./entry.bin', 'utf8');
  return c.body(cached, 200, { 'Content-Type': 'text/html; charset=utf-8' });
};
