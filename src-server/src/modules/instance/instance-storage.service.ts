import { InstanceDto, InstanceUploadQueryDto } from '@shared/dtos/instance.dto';
import { InstanceContentEnum } from '@shared/enums/general.enum';
import archiver from 'archiver';
import { cp, mkdir, readdir, readFile, rm, stat } from 'fs/promises';
import pLimit from 'p-limit';
import path from 'path';
import { Readable } from 'stream';
import { Extract } from 'unzipper';

import { NotFoundException } from '~/common/filters/exception.filter';
import { getHash } from '~/utils';

import { googleDriveService } from '../storage/drive.service';
import { instanceService } from './instance.service';

const INSTANCE_CONCURRENCY_LIMIT = 8;

export const instanceStorageService = new (class InstanceCloudService {
  private folderId = process.env.FOLDER_ID!;

  async uploadInstance(payload: InstanceUploadQueryDto) {
    const { id, filesPath } = payload;

    const instance = await instanceService.findOne(id);

    const files = await googleDriveService.list({
      q: `'${this.folderId}' in parents and properties has { key='id' and value='${id}' }`,
    });

    if (files.length > 0) {
      await googleDriveService.delete(files[0].id);
    }

    const dataStream = this.compressInstance(filesPath);

    const result = await googleDriveService.upload({
      data: dataStream,
      fileName: `${id}.zip`,
      parents: [this.folderId],
      properties: {
        id: instance.id,
        name: instance.name,
        version: instance.version,
        loaderType: instance.loader?.type,
        loaderBuild: instance.loader?.build,
        createdAt: instance.createdAt,
        updatedAt: instance.updatedAt,
      },
    });

    return result;
  }

  async downloadInstance(id: string) {
    const files = await googleDriveService.list({
      q: `'${this.folderId}' in parents and properties has { key='id' and value='${id}' }`,
    });

    if (files.length === 0) {
      throw new NotFoundException('Instance backup not found in cloud storage');
    }

    const fileMetadata = files[0];
    const instanceDir = await instanceService.getDir(id);
    const instanceTempDir = `${instanceDir}_temp`;

    // Download and extract to temp directory
    const dataStream = await googleDriveService.download(fileMetadata.id);
    await this.decompressInstance(dataStream, instanceTempDir);

    const instanceTemp: InstanceDto = JSON.parse(await readFile(await instanceService.getPath(`${id}_temp`), 'utf-8'));
    const contentTypes = [InstanceContentEnum.Mods, InstanceContentEnum.ResourcePacks, InstanceContentEnum.ShaderPacks];

    // Remove outdated files
    const limit = pLimit(INSTANCE_CONCURRENCY_LIMIT);
    for (const type of contentTypes) {
      const newContents = new Map((instanceTemp[type] || []).map((c) => [c.fileName, c]));

      const ext = type === InstanceContentEnum.Mods ? '.jar' : '.zip';

      const oldFolder = path.join(instanceDir, type);
      const oldFiles = await readdir(oldFolder)
        .then((v) => v.filter((i) => i.endsWith(ext)))
        .catch(() => []);

      const tasks = oldFiles.map((fileName: string) =>
        limit(async () => {
          const filePath = path.join(oldFolder, fileName);
          const newMeta = newContents.get(fileName);
          if (!newMeta) {
            await rm(filePath, { force: true, recursive: true });
            return;
          }
          const hash = await getHash(filePath).catch(() => null);
          if (!hash || hash.toLowerCase() !== newMeta.hash.toLowerCase()) {
            await rm(filePath, { force: true, recursive: true });
          }
        }),
      );

      await Promise.all(tasks);
    }

    // Move files from temp to instance directory and remove temp directory
    await cp(instanceTempDir, instanceDir, { recursive: true, force: true });
    await rm(instanceTempDir, { recursive: true, force: true });

    return {
      message: 'Download and extraction completed',
      data: {
        name: fileMetadata.name,
        size: fileMetadata.size,
        path: instanceDir,
      },
    };
  }

  private compressInstance(filesPath: string[]): Readable {
    const archive = archiver('zip', { zlib: { level: 9 } });

    (async () => {
      try {
        const baseDir = this.findCommonBaseDir(filesPath);

        for (const file of filesPath) {
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

  private async decompressInstance(stream: Readable, outputDir: string) {
    await mkdir(outputDir, { recursive: true });

    return new Promise<void>((resolve, reject) => {
      stream
        .pipe(Extract({ path: outputDir }))
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
