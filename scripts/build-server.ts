import { execSync } from 'child_process';
import { config, parse } from 'dotenv';
import { build } from 'esbuild';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import * as ResEdit from 'resedit';

config({ quiet: true });

const isProd = process.env.NODE_ENV === 'production';

const outfile = 'dist/server.cjs';
const target = 'node18';
const env = parse(readFileSync('.env'));
const define = Object.fromEntries(
  Object.entries(env).map(([key, value]) => [`process.env.${key}`, JSON.stringify(value ?? '')]),
);

(async () => {
  await build({
    entryPoints: ['src-server/src/index.ts'],
    bundle: true,
    platform: 'node',
    external: ['electron', 'prismarine-nbt'],
    target,
    format: 'cjs',
    outfile,
    define,
    minify: isProd,
    sourcemap: !isProd,
  });

  const outputFile = path.resolve('src-tauri/binaries/server-x86_64-pc-windows-msvc.exe');
  const pkgCmd = `pkg ${outfile} --targets ${target}-win-x64 --output ${outputFile} --assets node_modules/prismarine-nbt/**/*`;
  execSync(pkgCmd, { stdio: 'inherit' });

  const iconPath = path.resolve('src-client/src/assets/imgs/favicon.ico');
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
})();
