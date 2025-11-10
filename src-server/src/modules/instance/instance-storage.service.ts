import { InstanceUploadQueryDto } from '@shared/dtos/instance.dto';
import archiver from 'archiver';
import { mkdir, stat } from 'fs/promises';
import path from 'path';
import { Readable } from 'stream';
import { Extract } from 'unzipper';

import { NotFoundException } from '~/common/filters/exception.filter';

import { googleDriveService } from '../storage/drive.service';
import { instanceService } from './instance.service';

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

    const dataStream = await googleDriveService.download(fileMetadata.id);
    await this.decompressInstance(dataStream, instanceDir);

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
