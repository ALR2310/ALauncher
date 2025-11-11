import archiver from 'archiver';
import { mkdir, stat } from 'fs/promises';
import path from 'path';
import { Readable } from 'stream';
import { Extract } from 'unzipper';

export function compressInstance(filePaths: string[]): Readable {
  const archive = archiver('zip', { zlib: { level: 9 } });

  (async () => {
    try {
      const baseDir = findCommonBaseDir(filePaths);

      for (const file of filePaths) {
        const stats = await stat(file);
        const relative = path.relative(baseDir, file);
        if (stats.isDirectory()) archive.directory(file, relative);
        else archive.file(file, { name: relative });
      }

      await archive.finalize();
    } catch (err) {
      archive.destroy();
    }
  })();

  return archive;
}

export async function decompressInstance(stream: Readable, outputDir: string): Promise<void> {
  await mkdir(outputDir, { recursive: true });

  return new Promise<void>((resolve, reject) => {
    stream
      .pipe(Extract({ path: outputDir }))
      .on('close', resolve)
      .on('error', reject);
  });
}

function findCommonBaseDir(filePaths: string[]): string {
  if (filePaths.length === 0) return process.cwd();
  const dirs = filePaths.map((f) => path.dirname(path.resolve(f)));
  let common = dirs[0].split(path.sep);

  for (const dir of dirs.slice(1)) {
    const parts = dir.split(path.sep);
    const minLen = Math.min(common.length, parts.length);
    let i = 0;
    while (i < minLen && common[i] === parts[i]) i++;
    common = common.slice(0, i);
  }

  return common.join(path.sep) || path.parse(filePaths[0]).root;
}
