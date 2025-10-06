import 'dotenv/config';

import { parse } from 'dotenv';
import { build } from 'esbuild';
import { existsSync, readFileSync } from 'fs';

const outfile = 'dist/data.bin';
const target = 'node18';
let define: Record<string, string> = {};

if (existsSync('.env')) {
  const envFile = parse(readFileSync('.env'));
  define = Object.fromEntries(
    Object.entries(envFile).map(([key, value]) => [`process.env.${key}`, JSON.stringify(value ?? '')]),
  );
} else {
  const safeEnv = Object.entries(process.env).filter(([key]) => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key));
  define = Object.fromEntries(safeEnv.map(([key, value]) => [`process.env.${key}`, JSON.stringify(value ?? '')]));
}

define['process.env.NODE_ENV'] = JSON.stringify('production');

const isDev = process.env.NODE_ENV === 'development';

(async () => {
  try {
    console.log('⚙️ Starting esbuild...');
    await build({
      entryPoints: ['src-server/src/index.ts'],
      bundle: true,
      platform: 'node',
      external: ['electron'],
      target,
      format: 'cjs',
      outfile,
      define,
      minify: !isDev,
    });
  } catch (err) {
    console.error('build server failed:', err);
    process.exit(1);
  }
})();
