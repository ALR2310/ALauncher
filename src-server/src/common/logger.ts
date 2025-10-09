import { appendFile } from 'fs/promises';

function safeStringify(obj: any): string {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    const cache = new WeakSet();
    return JSON.stringify(
      obj,
      (_key, value) => {
        if (typeof value === 'object' && value !== null) {
          if (cache.has(value)) return '[Circular]';
          cache.add(value);
        }
        return value;
      },
      2,
    );
  }
}

export async function logger(message: unknown) {
  if (process.env.NODE_ENV === 'development') return;

  try {
    const timestamp = new Date().toISOString().replace('T', ' ').replace('Z', '');

    const text =
      typeof message === 'string'
        ? message
        : message instanceof Error
          ? `${message.name}: ${message.message}\n${message.stack ?? ''}`
          : safeStringify(message);

    const line = `[${timestamp}]: ${text}\n`;

    await appendFile('ALauncher.log', line, 'utf-8');
  } catch (err) {
    console.error('Failed to write log:', err);
  }
}
