import { ZodNumber } from 'zod';

ZodNumber.prototype.enum = function <E extends Record<string, unknown>>(enumObj: E) {
  const values = Object.values(enumObj).filter((v) => typeof v === 'number') as number[];
  return this.refine((val: any) => values.includes(val), {
    message: `Invalid enum value. Expected one of: ${values.join(' | ')}`,
  });
};
