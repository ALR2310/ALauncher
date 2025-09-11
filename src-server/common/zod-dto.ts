import { z, ZodType } from 'zod';

export function createZodDto<T extends ZodType>(schema: T) {
  class AugmentedZodDto {
    static isZodDto = true;
    static schema = schema;

    static create(input: unknown) {
      return schema.parse(input);
    }
  }

  return AugmentedZodDto as {
    new (): z.infer<T>;
    schema: T;
    isZodDto: true;
    create(input: unknown): z.infer<T>;
  };
}
