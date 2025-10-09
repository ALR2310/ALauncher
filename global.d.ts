import 'zod';

export {};

declare global {
  interface Window {
    isTauri: boolean;
  }
}

declare module 'zod' {
  interface ZodNumber {
    enum<E extends Record<string, unknown>>(enumObj: E): ZodNumber;
  }
  interface ZodCoercedNumber {
    enum<E extends Record<string, unknown>>(enumObj: E): ZodCoercedNumber;
  }
}
