import EventEmitter from 'events';
import { createReadStream, createWriteStream } from 'fs';
import { mkdir, readdir, stat, unlink } from 'fs/promises';
import os from 'os';
import path from 'path';
import { Readable } from 'stream';
import { open } from 'yauzl';
import { ZipFile } from 'yazl';

type Entry = {
  real: string;
  zip: string;
  size: number;
};

export class Zipper extends EventEmitter {
  async compress(inputPath: string): Promise<Readable>;
  async compress(inputPath: string, outputPath: string): Promise<void>;
  async compress(files: string[]): Promise<Readable>;
  async compress(files: string[], outputPath: string): Promise<void>;
  async compress(input: string | string[], outputPath?: string): Promise<Readable | void> {
    outputPath = this.normalizeOutputPath(outputPath);

    const zip = new ZipFile();
    let out: NodeJS.WritableStream | null = null;

    if (outputPath) {
      out = createWriteStream(outputPath);
    }

    const entries: Entry[] = [];
    let totalSize = 0;

    if (Array.isArray(input)) {
      const commonBase = this.findCommonBase(input);

      for (const fullPath of input) {
        const st = await stat(fullPath);
        if (!st.isFile()) continue;

        const relPath = path.relative(commonBase, fullPath).replace(/\\/g, '/');

        entries.push({
          real: fullPath,
          zip: relPath,
          size: st.size,
        });

        totalSize += st.size;
      }
    } else {
      const walk = async (realPath: string, zipPath: string) => {
        const st = await stat(realPath);

        if (st.isDirectory()) {
          const files = await readdir(realPath);
          if (files.length === 0) {
            zip.addEmptyDirectory(zipPath + '/');
          }
          for (const f of files) {
            await walk(path.join(realPath, f), path.join(zipPath, f).replace(/\\/g, '/'));
          }
        } else {
          entries.push({
            real: realPath,
            zip: zipPath.replace(/\\/g, '/'),
            size: st.size,
          });
          totalSize += st.size;
        }
      };

      const rootName = path.basename(input);
      await walk(input, rootName);
    }

    if (totalSize === 0) totalSize = 1;

    let processed = 0;
    let lastUpdate = 0;

    const emitProgress = () => {
      const now = Date.now();
      if (now - lastUpdate >= 500) {
        lastUpdate = now;
        const percent = Math.min(100, (processed / totalSize) * 100);
        this.emit('progress', percent);
      }
    };

    for (const e of entries) {
      zip.addReadStreamLazy(e.zip, { size: e.size, compressionLevel: 6 }, (cb) => {
        const rs = createReadStream(e.real, {
          highWaterMark: 512 * 1024,
        });

        rs.on('data', (chunk) => {
          processed += chunk.length;
          emitProgress();
        });

        rs.on('error', (err) => {
          this.emit('error', err);
          cb(err, rs);
        });

        cb(null, rs);
      });
    }

    const zipDone = new Promise<void>((resolve, reject) => {
      if (out) {
        zip.outputStream.pipe(out).on('close', resolve).on('error', reject);
      } else {
        zip.outputStream.on('end', resolve).on('close', resolve).on('error', reject);
      }
    });

    zip.end();

    if (!outputPath) {
      return zip.outputStream as unknown as Readable;
    }

    try {
      await zipDone;
      this.emit('progress', 100);
      this.emit('done');
    } catch (err) {
      this.emit('error', err);
    }
  }

  async decompress(filePath: string, outputDir: string): Promise<void>;
  async decompress(stream: Readable, outputDir: string): Promise<void>;
  async decompress(input: string | Readable, outputDir: string): Promise<void> {
    if (input instanceof Readable) {
      const tempFilePath = path.join(
        os.tmpdir(),
        `zipper-${Date.now()}-${Math.random().toString(36).substring(7)}.zip`,
      );
      const writeStream = createWriteStream(tempFilePath);

      try {
        await new Promise<void>((resolve, reject) => {
          input.pipe(writeStream);
          input.on('error', reject);
          writeStream.on('error', reject);
          writeStream.on('close', resolve);
        });

        await this.decompress(tempFilePath, outputDir);

        try {
          await unlink(tempFilePath);
        } catch (err) {
          console.warn('Cannot delete temp file:', tempFilePath, err);
        }
      } catch (err) {
        try {
          await unlink(tempFilePath).catch(() => {});
        } catch {}
        throw err;
      }
      return;
    }

    const filePath = input;
    const fileStat = await stat(filePath);
    const totalSize = fileStat.size || 1;

    let processed = 0;
    let lastUpdate = 0;

    const emitProgress = () => {
      const now = Date.now();
      if (now - lastUpdate >= 300) {
        lastUpdate = now;
        this.emit('progress', Math.min(100, (processed / totalSize) * 100));
      }
    };

    return new Promise<void>((resolve, reject) => {
      open(filePath, { lazyEntries: true }, (err, zipFile) => {
        if (err || !zipFile) return reject(err);

        zipFile.readEntry();

        zipFile.on('entry', (entry) => {
          const outputPath = path.join(outputDir, entry.fileName);

          if (/\/$/.test(entry.fileName)) {
            mkdir(outputPath, { recursive: true })
              .then(() => zipFile.readEntry())
              .catch(reject);
            return;
          }

          const dir = path.dirname(outputPath);

          mkdir(dir, { recursive: true })
            .then(() => {
              zipFile.openReadStream(entry, (err, readStream) => {
                if (err || !readStream) return reject(err);

                const writeStream = createWriteStream(outputPath);

                readStream.on('data', (chunk) => {
                  processed += chunk.length;
                  emitProgress();
                });

                readStream.on('error', reject);
                writeStream.on('error', reject);

                writeStream.on('close', () => {
                  zipFile.readEntry();
                });

                readStream.pipe(writeStream);
              });
            })
            .catch(reject);
        });

        zipFile.on('end', () => {
          this.emit('progress', 100);
          this.emit('done');
          resolve();
        });

        zipFile.on('error', (err) => {
          this.emit('error', err);
          reject(err);
        });
      });
    });
  }

  private findCommonBase(paths: string[]): string {
    if (paths.length === 0) return '';

    const splitPaths = paths.map((p) => p.split(/[\\/]+/));

    const minLen = Math.min(...splitPaths.map((p) => p.length));
    let i = 0;

    for (; i < minLen; i++) {
      const segment = splitPaths[0][i];
      if (!splitPaths.every((p) => p[i] === segment)) break;
    }

    return splitPaths[0].slice(0, i).join(path.sep);
  }

  private normalizeOutputPath(outputPath?: string) {
    if (!outputPath) return undefined;

    const ext = path.extname(outputPath).toLowerCase();

    if (ext === '.zip') return outputPath;
    if (ext === '') return outputPath + '.zip';

    return outputPath + '.zip';
  }
}
