import { Context } from 'hono';
import { ContentfulStatusCode } from 'hono/utils/http-status';
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

export const exceptionMiddleware = (err: Error, c: Context) => {
  if (err instanceof HttpException) {
    return c.json({ message: err.message, status: err.status }, err.status as ContentfulStatusCode);
  }
  return c.json({ message: 'Internal Server Error', status: 500 }, 500);
};
