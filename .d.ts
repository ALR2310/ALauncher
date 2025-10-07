import 'zod';

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}

declare module '*.webp' {
  const content: string;
  export default content;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface ImportMetaEnv {
  readonly MODE: 'development' | 'production' | 'test';
  readonly VITE_SERVER_PORT: string;
  readonly VITE_CURSEFORGE_API_KEY: string;
}

declare module 'zod' {
  interface ZodNumber {
    enum<E extends Record<string, unknown>>(enumObj: E): ZodNumber;
  }
  interface ZodCoercedNumber {
    enum<E extends Record<string, unknown>>(enumObj: E): ZodCoercedNumber;
  }
}
