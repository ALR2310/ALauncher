import { BaseResponseDto } from '@shared/dtos/base.dto';
import {
  InstanceCloudDownloadResponseDto,
  InstanceCloudDto,
  InstanceCloudUploadQueryDto,
  InstanceCloudUploadResponseDto,
  InstanceDto,
} from '@shared/dtos/instance.dto';
import { InstanceContentEnum, InstanceStatusEnum } from '@shared/enums/general.enum';
import { cp, readdir, readFile, rm } from 'fs/promises';
import pLimit from 'p-limit';
import path from 'path';

import { BadRequestException, NotFoundException } from '~/common/filters/exception.filter';
import { getHash, Zipper } from '~/utils';

import { FileResponse, googleDriveService } from '../storage/drive.service';
import { instanceService } from './instance.service';

export const instanceCloudService = new (class InstanceCloudService {
  private folderId = process.env.FOLDER_ID!;
  private readonly limit = 8;

  async findAll(): Promise<InstanceCloudDto[]> {
    const files = await googleDriveService.list({
      q: `'${this.folderId}' in parents`,
      fields: ['properties'],
    });

    const cloudInstances = files.map((file) => this.mapCloudFile(file));

    const localInstances = await instanceService.findAll({}).catch(() => []);
    const localMap = new Map(localInstances.map((local: InstanceDto) => [local.id, local]) as [string, InstanceDto][]);

    const result = cloudInstances.map((cloud) => {
      const local = localMap.get(cloud.id);
      return this.mapCloudData(cloud, local);
    });

    return result;
  }

  async findOne(id: string): Promise<InstanceCloudDto> {
    const file = await googleDriveService
      .list({
        q: `'${this.folderId}' in parents and properties has { key='id' and value='${id}' }`,
        fields: ['properties'],
      })
      .then((res) => (res.length > 0 ? res[0] : null));

    if (!file) {
      throw new NotFoundException('Not found instance in cloud storage');
    }

    const cloud = this.mapCloudFile(file);

    const local = await instanceService.findOne(id).catch(() => undefined);

    return this.mapCloudData(cloud, local);
  }

  async upload(payload: InstanceCloudUploadQueryDto) {
    const { id, filePaths } = payload;

    const instance = await instanceService.findOne(id);

    const fileExisting = await googleDriveService.list({
      q: `'${this.folderId}' in parents and properties has { key='id' and value='${id}' }`,
    });

    if (fileExisting.length > 0) {
      await googleDriveService.delete(fileExisting[0].id);
    }

    const zipper = new Zipper();

    const dataStream = await zipper.compress(filePaths);

    const fileId = await googleDriveService.upload({
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

    const file = await googleDriveService.get(fileId);

    return {
      message: 'Upload completed',
      data: {
        name: file.name,
        size: Number(file.size),
        path: `drive://${this.folderId}/${file.id}`,
      },
    } as InstanceCloudUploadResponseDto;
  }

  async download(id: string, outDir?: string) {
    const files = await googleDriveService.list({
      q: `'${this.folderId}' in parents and properties has { key='id' and value='${id}' }`,
    });

    if (files.length === 0) {
      throw new NotFoundException('Instance backup not found in cloud storage');
    }

    const fileMetadata = files[0];
    const targetDir = outDir || (await instanceService.getDir(id));

    // Download and extract to target directory
    const zipper = new Zipper();

    const dataStream = await googleDriveService.download(fileMetadata.id);

    await zipper.decompress(dataStream, targetDir);

    return {
      message: 'Download and extraction completed',
      data: {
        name: fileMetadata.name,
        size: Number(fileMetadata.size),
        path: targetDir,
      },
    } as InstanceCloudDownloadResponseDto;
  }

  async sync(id: string): Promise<BaseResponseDto> {
    const instanceDir = await instanceService.getDir(id);
    const instanceTempDir = `${instanceDir}_temp`;

    // Download to temp directory
    await this.download(id, instanceTempDir);

    const instanceTemp: InstanceDto = JSON.parse(await readFile(await instanceService.getPath(`${id}_temp`), 'utf-8'));
    const contentTypes = [InstanceContentEnum.Mods, InstanceContentEnum.ResourcePacks, InstanceContentEnum.ShaderPacks];

    // Remove outdated files
    const limit = pLimit(this.limit);
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

    return { message: 'Sync instance completed' };
  }

  async delete(id: string): Promise<BaseResponseDto> {
    try {
      const file = await googleDriveService
        .list({
          q: `'${this.folderId}' in parents and properties has { key='id' and value='${id}' }`,
        })
        .then((res) => (res.length > 0 ? res[0] : null));

      if (!file) {
        throw new NotFoundException('Not found instance in cloud storage');
      }

      await googleDriveService.delete(file.id);
      return { message: 'Instance cloud deleted successfully' };
    } catch (err: any) {
      throw new BadRequestException(err.message);
    }
  }

  private mapCloudFile(file: FileResponse): InstanceCloudDto {
    return {
      id: file.properties.id,
      name: file.properties.name,
      version: file.properties.version,
      loader:
        file.properties.loaderType && file.properties.loaderBuild
          ? {
              type: Number(file.properties.loaderType),
              build: file.properties.loaderBuild,
            }
          : undefined,
      createdAt: file.properties.createdAt,
      updatedAt: file.properties.updatedAt,
      // Cloud metadata
      fileId: file.id,
      fileName: file.name,
      fileSize: Number(file.size),
      mimeType: file.mimeType,
      modifiedTime: file.modifiedTime,
    };
  }

  private mapCloudData(cloud: InstanceCloudDto, local?: InstanceDto): InstanceCloudDto {
    if (!local) {
      return { ...cloud, status: InstanceStatusEnum.NotInstalled };
    }

    const localTime = new Date(local.updatedAt || local.createdAt).getTime();
    const cloudTime = new Date(cloud.updatedAt || cloud.modifiedTime).getTime();
    const status = localTime < cloudTime ? InstanceStatusEnum.UpdateAvailable : InstanceStatusEnum.Latest;

    return { ...cloud, status };
  }
})();
