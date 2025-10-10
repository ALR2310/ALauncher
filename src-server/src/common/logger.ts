import { appendFile } from 'fs/promises';

function safeStringify(obj: any): string {
  const cache = new WeakSet();
  try {
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
  } catch {
    return String(obj);
  }
}

export async function logger(...messages: unknown[]) {
  const timestamp = new Date().toISOString().replace('T', ' ').replace('Z', '');
  const text = messages
    .map((msg) =>
      typeof msg === 'string'
        ? msg
        : msg instanceof Error
          ? `${msg.name}: ${msg.message}\n${msg.stack ?? ''}`
          : safeStringify(msg),
    )
    .join(' ');

  const line = `[${timestamp}]: ${text}\n`;

  if (process.env.NODE_ENV === 'development') {
    console.log(line.trimEnd());
    return;
  }

  try {
    await appendFile('ALauncher.log', line, 'utf-8');
  } catch (err) {
    console.error('Failed to write log:', err);
  }
}
