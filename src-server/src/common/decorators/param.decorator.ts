import 'reflect-metadata';

export const PARAMS_KEY = Symbol('params');

export type ParamType = 'body' | 'param' | 'query' | 'payload' | 'context';

export interface ParamMetadata {
  index: number;
  type: ParamType;
  key?: string;
}

function createParamDecorator(type: ParamType, key?: string) {
  return function (target: any, propertyKey: string, parameterIndex: number) {
    const params: ParamMetadata[] = Reflect.getMetadata(PARAMS_KEY, target, propertyKey) || [];

    params.push({ index: parameterIndex, type, key });

    Reflect.defineMetadata(PARAMS_KEY, params, target, propertyKey);
  };
}

export const Body = () => createParamDecorator('body');
export const Query = (key?: string) => createParamDecorator('query', key);
export const Param = (key?: string) => createParamDecorator('param', key);
export const Payload = () => createParamDecorator('payload');
export const Context = () => createParamDecorator('context');
