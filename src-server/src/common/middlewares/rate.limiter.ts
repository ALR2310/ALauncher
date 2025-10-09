import { rateLimiter } from 'hono-rate-limiter';

export function createRateLimiter() {
  return rateLimiter({
    windowMs: 1000,
    limit: 10,
    standardHeaders: true,
    message: 'Too many requests, please try again later.',
    keyGenerator: (c) => {
      const ip =
        c.req.header('x-forwarded-for') || c.req.header('cf-connecting-ip') || c.req.header('x-real-ip') || 'unknown';
      return `${ip}:${c.req.path}`;
    },
  });
}
