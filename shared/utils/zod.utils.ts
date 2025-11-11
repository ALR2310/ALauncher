import z, { ZodNumber, ZodType } from 'zod';

ZodNumber.prototype.enum = function <E extends Record<string, unknown>>(enumObj: E) {
  const values = Object.values(enumObj).filter((v) => typeof v === 'number') as number[];
  return this.refine((val: any) => values.includes(val), {
    message: `Invalid enum value. Expected one of: ${values.join(' | ')}`,
  });
};

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
