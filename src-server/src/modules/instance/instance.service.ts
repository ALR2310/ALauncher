import { InstanceDto, InstanceQueryDto, instanceSchema, InstanceWorldDto } from '@shared/dtos/instance.dto';
import { InstanceContentEnum } from '@shared/enums/general.enum';
import { existsSync } from 'fs';
import { mkdir, readdir, readFile, rename, rm, writeFile } from 'fs/promises';
import pLimit from 'p-limit';
import path from 'path';
import { parse } from 'prismarine-nbt';

import { BadRequestException, NotFoundException } from '~/common/filters/exception.filter';
import { logger } from '~/common/logger';

import { appService } from '../app/app.service';

export const instanceService = new (class InstanceService {
  private instanceDirCache: string | null = null;

  async findAll(payload: InstanceQueryDto): Promise<InstanceDto[]> {
    const { sortBy = 'lastPlayed', sortDir = 'desc' } = payload;

    try {
      const instanceDir = await this.getDir();
      const folders = await readdir(instanceDir, { withFileTypes: true });
      const limiter = pLimit(10);

      const readTasks = folders
        .filter((f) => f.isDirectory())
        .map((dir) =>
          limiter(async () => {
            const instancePath = await this.getPath(dir.name);
            try {
              const data = await readFile(instancePath, 'utf-8');
              const parsed = instanceSchema.parse(JSON.parse(data));
              return parsed;
            } catch (err) {
              console.log(err);
              logger(`Failed to read instance "${dir.name}"`);
              return null;
            }
          }),
        );

      const instances = (await Promise.all(readTasks)).filter(Boolean) as InstanceDto[];

      const sorted = instances.sort((a, b) => {
        const aVal = a[sortBy] ?? '';
        const bVal = b[sortBy] ?? '';
        if (sortDir === 'asc') return aVal > bVal ? 1 : -1;
        return aVal < bVal ? 1 : -1;
      });

      return sorted;
    } catch (err) {
      throw new NotFoundException('No instances found');
    }
  }

  async findOne(id: string): Promise<InstanceDto> {
    if (!id) throw new NotFoundException('Instance ID is required');

    try {
      const instancePath = await this.getPath(id);
      const jsonString = await readFile(instancePath, 'utf-8');
      return JSON.parse(jsonString);
    } catch (err) {
      throw new NotFoundException(`Instance with ID "${id}" not found`);
    }
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
      const instanceDir = await this.getDir(id);
      const worldDir = path.resolve(instanceDir, 'worlds');
      const limit = pLimit(10);

      const entries = await readdir(worldDir, { withFileTypes: true });
      const readTasks = entries
        .filter((e) => e.isDirectory())
        .map((dir) =>
          limit(async () => {
            const levelDatPath = path.resolve(worldDir, dir.name, 'level.dat');

            try {
              const buffer = await readFile(levelDatPath);
              const { parsed } = await parse(buffer);

              const data: any = parsed.value.Data?.value;

              if (!data || typeof data !== 'object' || Array.isArray(data)) {
                logger(`Invalid NBT data in ${dir.name}/level.dat`);
                return null;
              }

              const iconPath = path.join(worldDir, dir.name, 'icon.png');
              let iconBase64: string | undefined;

              if (existsSync(iconPath)) {
                const iconBuffer = await readFile(iconPath);
                iconBase64 = `data:image/png;base64,${iconBuffer.toString('base64')}`;
              }

              const result: InstanceWorldDto = {
                instanceId: id,
                name: data.LevelName?.value ?? 'Unknown',
                folderName: dir.name,
                version: data.Version?.value?.Name?.value ?? 'Unknown',
                icon: iconBase64,
                gameType: data.GameType?.value ?? 0,
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

    if (!this.instanceDirCache) {
      this.instanceDirCache = path.resolve(config.minecraft.gameDir, 'versions');
    }
    return path.join(this.instanceDirCache, id ?? '');
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
      contentDir = path.resolve(instanceDir, InstanceContentEnum.Worlds, worldName, contentType);
    } else {
      contentDir = path.resolve(instanceDir, contentType);
    }

    return contentDir;
  }
})();
