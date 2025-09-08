import { ZodType } from 'zod';

export function Validate<T extends ZodType>(schema: T) {
  return function (_target: any, _propertyKey: string, descriptor: PropertyDescriptor) {
    const original = descriptor.value;
    descriptor.value = function (input: unknown, ...args: any[]) {
      const data = schema.parse(input);
      return original.apply(this, [data, ...args]);
    };
  };
}
