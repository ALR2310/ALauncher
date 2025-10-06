import { Method } from 'axios';
import chalk from 'chalk';
import { Context, Hono } from 'hono';
import { ZodType } from 'zod';

import { BASE_PATH_KEY, ParamMetadata, PARAMS_KEY, RouteMetadata, ROUTES_KEY, VALIDATE_KEY } from './decorators';

type ControllerClass<T = any> = new (...args: any[]) => T;
type ControllerInstance = object;

async function safeJson(c: Context) {
  try {
    return await c.req.json();
  } catch {
    return {};
  }
}

function safePath(base: string = '', sub: string = ''): string {
  let b = base || '';
  let s = sub || '';
  if (b && !b.startsWith('/')) b = '/' + b;
  if (s && !s.startsWith('/')) s = '/' + s;
  const full = `${b}${s}`;
  return full || '/';
}

export function registerController(app: Hono, controllers: (ControllerClass | ControllerInstance)[]) {
  const list = Array.isArray(controllers) ? controllers : [controllers];

  for (const ctrl of list) {
    const controller = typeof ctrl === 'function' ? new (ctrl as any)() : ctrl;

    const basePath: string = Reflect.getMetadata(BASE_PATH_KEY, controller.constructor) || '';
    const routes: RouteMetadata[] = Reflect.getMetadata(ROUTES_KEY, controller.constructor) || [];

    for (const route of routes) {
      const handler = (controller as any)[route.handlerName].bind(controller);
      const fullPath = safePath(basePath, route.path);

      (app as any)[route.method](fullPath, async (c: Context) => {
        const body = await safeJson(c);
        const params = c.req.param();
        const query = c.req.query();
        let payload: any = { ...body, ...params, ...query };

        const schemaOrDto = Reflect.getMetadata(VALIDATE_KEY, controller, route.handlerName);

        if (schemaOrDto) {
          if ((schemaOrDto as any).isZodDto) {
            payload = (schemaOrDto as any).create(payload);
          } else {
            payload = (schemaOrDto as ZodType).parse(payload);
          }

          for (const key of Object.keys(payload)) {
            if (key in params) params[key] = payload[key];
            if (key in body) body[key] = payload[key];
            if (key in query) query[key] = payload[key];
          }
        }

        const paramMetas: ParamMetadata[] = Reflect.getMetadata(PARAMS_KEY, controller, route.handlerName) || [];
        const args: any[] = [];

        for (const meta of paramMetas) {
          switch (meta.type) {
            case 'body':
              args[meta.index] = body;
              break;
            case 'param':
              args[meta.index] = meta.key ? params[meta.key] : params;
              break;
            case 'query':
              args[meta.index] = meta.key ? query[meta.key] : query;
              break;
            case 'payload':
              args[meta.index] = payload;
              break;
            case 'context':
              args[meta.index] = c;
              break;
          }
        }

        const result = await handler(...args, c);

        if (result instanceof Response) return result;
        if (typeof result === 'string') return c.text(result);
        if (typeof result === 'number') return c.text(result.toString());
        if (typeof result === 'object') return c.json(result);
        return c.text('');
      });

      const ctrlName = controller.constructor.name;
      let methodColor: string;
      switch (route.method as Method) {
        case 'get':
          methodColor = chalk.green(route.method.toUpperCase());
          break;
        case 'post':
          methodColor = chalk.yellow(route.method.toUpperCase());
          break;
        case 'put':
          methodColor = chalk.cyan(route.method.toUpperCase());
          break;
        case 'delete':
          methodColor = chalk.red(route.method.toUpperCase());
          break;
        default:
          methodColor = chalk.white(route.method.toUpperCase());
      }

      console.log(
        `[Route] ${methodColor} ${chalk.blue(fullPath)} -> ${chalk.magenta(ctrlName)}.${route.handlerName}()`,
      );
    }
  }
}
