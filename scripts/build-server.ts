import { execSync } from 'child_process';
import { config, parse } from 'dotenv';
import { build } from 'esbuild';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import * as ResEdit from 'resedit';

config({ quiet: true });

const isDev = process.env.NODE_ENV === 'development';

const outfile = 'dist/server.cjs';
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

(async () => {
  try {
    console.log('⚙️ Starting esbuild...');
    await build({
      entryPoints: ['src-server/src/index.ts'],
      bundle: true,
      platform: 'node',
      external: ['electron', 'prismarine-nbt'],
      target,
      format: 'cjs',
      outfile,
      define,
      minify: !isDev,
      sourcemap: isDev,
    });
    console.log('✅ esbuild done');

    const outputFile = path.resolve('src-tauri/binaries/server-x86_64-pc-windows-msvc.exe');
    const pkgCmd = `pkg ${outfile} --targets ${target}-win-x64 --output ${outputFile} --assets "node_modules/prismarine-nbt/**/*"`;
    execSync(pkgCmd, { stdio: 'inherit' });
    console.log('✅ pkg done, output at', outputFile);

    const iconPath = path.resolve('src-client/src/assets/imgs/favicon.ico');
    console.log('⚙️ Loading icon from', iconPath);
    const iconFile = ResEdit.Data.IconFile.from(readFileSync(iconPath));

    const exeData = readFileSync(outputFile);
    const exe = ResEdit.NtExecutable.from(exeData);
    const res = ResEdit.NtExecutableResource.from(exe);

    ResEdit.Resource.IconGroupEntry.replaceIconsForResource(
      res.entries,
      1,
      1033,
      iconFile.icons.map((icon) => icon.data),
    );

    res.outputResource(exe);
    const modifiedExe = exe.generate();
    writeFileSync(outputFile, Buffer.from(modifiedExe));
    console.log('✅ Updated exe with icon');
  } catch (err) {
    console.error('❌ build-server failed:', err);
    process.exit(1);
  }
})();
