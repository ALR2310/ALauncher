import archiver from 'archiver';
import { createReadStream, createWriteStream } from 'fs';
import { mkdir, stat } from 'fs/promises';
import path from 'path';
import unzipper from 'unzipper';

import { instanceService } from './instance.service';

export const instanceCloudService = new (class InstanceCloudService {
  async uploadInstance(payload: { id: string; files: string[] }) {
    const { id, files } = payload;

    const instanceDir = await instanceService.getDir(id);

    return await this.compressInstance(files, `${instanceDir}.zip`);
  }

  async downloadInstance(id: string) {
    const instanceDir = await instanceService.getDir(id);

    return await this.decompressInstance(`${instanceDir}.zip`, instanceDir);
  }

  private async compressInstance(filePath: string[], outputPath: string) {
    return new Promise<void>((resolve, reject) => {
      const output = createWriteStream(outputPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', resolve);
      archive.on('error', reject);
      archive.pipe(output);

      (async () => {
        try {
          const baseDir = this.findCommonBaseDir(filePath);

          for (const file of filePath) {
            const stats = await stat(file);
            const relative = path.relative(baseDir, file);
            if (stats.isDirectory()) archive.directory(file, relative);
            else archive.file(file, { name: relative });
          }

          await archive.finalize();
        } catch (err) {
          reject(err);
        }
      })();
    });
  }

  private async decompressInstance(filePath: string, outputDir: string) {
    await mkdir(outputDir, { recursive: true });

    return new Promise<void>((resolve, reject) => {
      createReadStream(filePath)
        .pipe(unzipper.Parse())
        .on('entry', async (entry) => {
          const outPath = path.join(outputDir, entry.path);
          if (entry.type === 'Directory') {
            await mkdir(outPath, { recursive: true });
            entry.autodrain();
          } else {
            await mkdir(path.dirname(outPath), { recursive: true });
            entry.pipe(createWriteStream(outPath));
          }
        })
        .on('close', resolve)
        .on('error', reject);
    });
  }

  private findCommonBaseDir(files: string[]): string {
    if (files.length === 0) return process.cwd();
    const dirs = files.map((f) => path.dirname(path.resolve(f)));
    let common = dirs[0].split(path.sep);

    for (const dir of dirs.slice(1)) {
      const parts = dir.split(path.sep);
      const minLen = Math.min(common.length, parts.length);
      let i = 0;
      while (i < minLen && common[i] === parts[i]) i++;
      common = common.slice(0, i);
    }

    return common.join(path.sep) || path.parse(files[0]).root;
  }
})();
