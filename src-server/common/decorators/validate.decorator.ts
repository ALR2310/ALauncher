import 'reflect-metadata';

import { ZodType } from 'zod';

export const VALIDATE_KEY = Symbol('validate');

type ZodDtoClass = {
  isZodDto: true;
  schema: ZodType;
  create(input: unknown): any;
};

export function Validate(schemaOrDto: ZodType | ZodDtoClass) {
  return function (target: any, propertyKey: string) {
    Reflect.defineMetadata(VALIDATE_KEY, schemaOrDto, target, propertyKey);
  };
}
