import 'reflect-metadata';

export const ROUTES_KEY = Symbol('routes');
export const BASE_PATH_KEY = Symbol('basePath');

export type Method = 'get' | 'post' | 'put' | 'delete' | 'patch';

export interface RouteMetadata {
  method: Method;
  path: string;
  handlerName: string;
}

export function Controller(basePath: string = '') {
  return function (target: any) {
    Reflect.defineMetadata(BASE_PATH_KEY, basePath, target);
  };
}

function createMethodDecorator(method: Method) {
  return function (path: string = '') {
    return function (target: any, propertyKey: string) {
      const routes: RouteMetadata[] = Reflect.getMetadata(ROUTES_KEY, target.constructor) || [];

      routes.push({ method, path, handlerName: propertyKey });

      Reflect.defineMetadata(ROUTES_KEY, routes, target.constructor);
    };
  };
}

export const Get = createMethodDecorator('get');
export const Post = createMethodDecorator('post');
export const Put = createMethodDecorator('put');
export const Delete = createMethodDecorator('delete');
export const Patch = createMethodDecorator('patch');
