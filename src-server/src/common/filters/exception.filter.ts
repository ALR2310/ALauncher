import { Context } from 'hono';
import { ContentfulStatusCode } from 'hono/utils/http-status';
import z from 'zod';

import { logger } from '../logger';

export class HttpException extends Error {
  status: number;
  constructor(message: string, status: number = 500) {
    super(message);
    this.status = status;
  }
}

export class BadRequestException extends HttpException {
  constructor(message = 'Bad Request') {
    super(message, 400);
  }
}

export class NotFoundException extends HttpException {
  constructor(message = 'Not Found') {
    super(message, 404);
  }
}

export class InternalServerException extends HttpException {
  constructor(message = 'Internal Server Error') {
    super(message, 500);
  }
}

export const exception = (err: Error, c: Context) => {
  logger(err);

  if (err instanceof HttpException) {
    return c.json({ message: err.message, status: err.status }, err.status as ContentfulStatusCode);
  }

  if (err instanceof z.ZodError) {
    return c.json(
      {
        status: 400,
        errors: err.issues.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
          code: e.code,
        })),
      },
      400,
    );
  }

  return c.json({ message: 'Internal Server Error', status: 500 }, 500);
};
