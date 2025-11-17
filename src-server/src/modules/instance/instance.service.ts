import { InstanceDto, InstanceQueryDto, instanceSchema, InstanceWorldDto } from '@shared/dtos/instance.dto';
import { InstanceContentEnum, InstanceStatusEnum } from '@shared/enums/general.enum';
import { deserialize } from '@xmcl/nbt';
import { existsSync } from 'fs';
import { mkdir, readdir, readFile, rename, rm, writeFile } from 'fs/promises';
import pLimit from 'p-limit';
import path from 'path';

import { BadRequestException, NotFoundException } from '~/common/filters/exception.filter';
import { logger } from '~/common/logger';

import { appService } from '../app/app.service';
import { FileResponse, googleDriveService } from '../storage/drive.service';

export const instanceService = new (class InstanceService {
  private readonly limit = pLimit(10);
  private readonly folderId = process.env.FOLDER_ID!;

  async findAll(payload: InstanceQueryDto): Promise<InstanceDto[]> {
    const { sortBy = 'lastPlayed', sortDir = 'desc', checkStatus = false } = payload;

    const instanceDir = await this.getDir();
    const entries = await readdir(instanceDir, { withFileTypes: true }).catch(() => []);
    const limiter = pLimit(10);

    const localResults = await Promise.allSettled(
      entries
        .filter((f) => f.isDirectory())
        .map((dir) =>
          limiter(async () => {
            try {
              const json = await readFile(await this.getPath(dir.name), 'utf-8');
              return instanceSchema.parse(JSON.parse(json));
            } catch {
              console.log(`Failed to read instance "${dir.name}"`);
              return null;
            }
          }),
        ),
    );

    const locals = localResults
      .filter((r): r is PromiseFulfilledResult<InstanceDto | null> => r.status === 'fulfilled')
      .map((r) => r.value)
      .filter(Boolean) as InstanceDto[];

    if (!checkStatus) {
      locals.sort((a, b) => {
        const av = a[sortBy] ?? '';
        const bv = b[sortBy] ?? '';
        return sortDir === 'asc' ? (av > bv ? 1 : -1) : av < bv ? 1 : -1;
      });

      return locals;
    }

    const cloudFiles = await googleDriveService
      .list({
        q: `'${this.folderId}' in parents`,
        fields: ['properties'],
      })
      .catch(() => []);

    const cloudMap = new Map(
      cloudFiles.map((file: FileResponse) => [
        file.properties.id,
        {
          id: file.properties.id,
          updatedAt: file.properties.updatedAt,
          modifiedTime: file.modifiedTime,
        },
      ]) as Array<[string, any]>,
    );

    const list = locals.map((local) => {
      const cloud = cloudMap.get(local.id);
      return this.mapLocalData(local, cloud);
    });

    list.sort((a, b) => {
      const av = a[sortBy] ?? '';
      const bv = b[sortBy] ?? '';
      return sortDir === 'asc' ? (av > bv ? 1 : -1) : av < bv ? 1 : -1;
    });

    return list;
  }

  async findOne(id: string): Promise<InstanceDto> {
    if (!id) throw new NotFoundException('Instance ID is required');

    let local: InstanceDto | null = null;

    try {
      const instancePath = await this.getPath(id);
      const json = await readFile(instancePath, 'utf-8');
      local = instanceSchema.parse(JSON.parse(json));
    } catch {
      local = null;
    }

    if (!local) {
      throw new NotFoundException(`Instance with ID "${id}" not found`);
    }

    const cloudFiles = await googleDriveService
      .list({
        q: `'${this.folderId}' in parents and properties has { key='id' and value='${id}' }`,
        fields: ['properties'],
      })
      .catch(() => []);

    const instanceCloud =
      cloudFiles.length > 0
        ? {
            id: cloudFiles[0].properties.id,
            updatedAt: cloudFiles[0].properties.updatedAt,
            modifiedTime: cloudFiles[0].modifiedTime,
          }
        : undefined;

    return this.mapLocalData(local, instanceCloud);
  }

  async create(instance: InstanceDto) {
    try {
      const existing = await this.findOne(instance.id).catch(() => null);
      if (existing) throw new BadRequestException(`Instance already exists`);

      const instanceDir = await this.getDir(instance.id);
      const instancePath = await this.getPath(instance.id);

      await mkdir(instanceDir, { recursive: true });
      await writeFile(instancePath, JSON.stringify(instance, null, 2), 'utf-8');
      return instance;
    } catch (err: any) {
      throw new NotFoundException(`Failed to create instance: ${err.message}`);
    }
  }

  async update(id: string, data: Partial<InstanceDto>): Promise<InstanceDto> {
    try {
      const instanceDir = await this.getDir();
      const instancePath = await this.getPath(id);
      const existing = await this.findOne(id);
      const updated = { ...existing, ...data, id: data.id ?? id, updatedAt: new Date().toISOString() };

      await writeFile(instancePath, JSON.stringify(updated, null, 2), 'utf-8');

      if (data.id && data.id !== id) {
        const newDir = path.join(instanceDir, data.id);
        const oldDir = path.join(instanceDir, id);

        await rename(oldDir, newDir);
      }

      return updated;
    } catch (err: any) {
      throw new BadRequestException(`Failed to update instance: ${err.message}`);
    }
  }

  async delete(id: string): Promise<InstanceDto> {
    try {
      const existing = await this.findOne(id);

      const instanceDir = await this.getDir(id);
      await rm(instanceDir, { recursive: true, force: true });
      return existing;
    } catch (err: any) {
      throw new BadRequestException(`Failed to delete instance: ${err.message}`);
    }
  }

  async getWorlds(id: string): Promise<InstanceWorldDto[]> {
    if (!id) throw new NotFoundException('Instance ID is required');

    try {
      const worldDir = await this.getContentDir(id, InstanceContentEnum.Worlds);

      const entries = await readdir(worldDir, { withFileTypes: true }).catch(() => []);

      if (entries.length === 0) return [];

      const readTasks = entries
        .filter((e) => e.isDirectory())
        .map((dir) =>
          this.limit(async () => {
            try {
              const filePath = path.join(worldDir, dir.name, 'level.dat');
              const fileData = await readFile(filePath);
              const world = await deserialize(fileData, { compressed: true }).then((res: any) => res.Data);

              const iconPath = path.join(worldDir, dir.name, 'icon.png');
              let iconBase64: string | undefined;

              if (existsSync(iconPath)) {
                const iconBuffer = await readFile(iconPath);
                iconBase64 = `data:image/png;base64,${iconBuffer.toString('base64')}`;
              }

              const result: InstanceWorldDto = {
                instanceId: id,
                worldName: world.LevelName,
                worldVersion: world.Version.Name,
                gameType: world.GameType,
                gameDifficulty: world.Difficulty,
                allowCommands: world.allowCommands === 1,
                hardcore: world.Hardcore === 1,
                seed: world.WorldGenSettings.seed,
                icon: iconBase64,
                path: path.join(worldDir, dir.name),
              };

              return result;
            } catch (err) {
              logger(`Failed to read world ${dir.name}/level.dat:`, err);
              return null;
            }
          }),
        );

      const worlds = (await Promise.all(readTasks)).filter(Boolean) as InstanceWorldDto[];
      return worlds;
    } catch (err: any) {
      throw new BadRequestException(`Failed to get worlds: ${err.message}`);
    }
  }

  /**
   * Get the base directory for instances
   *
   * Example: `/path/to/minecraft/versions/<id>`
   */
  async getDir(id?: string): Promise<string> {
    const config = await appService.getConfig();
    return path.join(config.minecraft.gameDir, 'versions', id ?? '');
  }

  /**
   * Get the full path to an instance's JSON file
   *
   * Example: `/path/to/minecraft/versions/<id>/instance.json`
   */
  async getPath(id: string): Promise<string> {
    const instanceDir = await this.getDir();
    return path.resolve(instanceDir, id, 'instance.json');
  }

  /**
   * Get the directory for a specific content type within an instance
   *
   * Example: `/path/to/minecraft/versions/<id>/mods`
   */
  async getContentDir(instanceId: string, contentType: InstanceContentEnum, worldName?: string) {
    const instanceDir = await this.getDir(instanceId);
    let contentDir: string;

    if (contentType === InstanceContentEnum.DataPacks) {
      if (!worldName?.trim()) throw new BadRequestException('World name is required for datapacks');
      contentDir = path.resolve(instanceDir, 'saves', worldName, contentType);
    } else if (contentType === InstanceContentEnum.Worlds) {
      contentDir = path.resolve(instanceDir, 'saves');
    } else {
      contentDir = path.resolve(instanceDir, contentType);
    }

    return contentDir;
  }

  private mapLocalData(
    instanceLocal: InstanceDto,
    instanceCloud?: { updatedAt?: string; modifiedTime?: string },
  ): InstanceDto {
    if (!instanceCloud) {
      return { ...instanceLocal, status: InstanceStatusEnum.Latest };
    }

    const localTime = new Date(instanceLocal.updatedAt || instanceLocal.createdAt).getTime();
    const cloudTime = new Date(instanceCloud.updatedAt || instanceCloud.modifiedTime || '').getTime();
    const status = localTime < cloudTime ? InstanceStatusEnum.UpdateAvailable : InstanceStatusEnum.Latest;

    return { ...instanceLocal, status };
  }
})();
