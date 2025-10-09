import { categoryMap } from '@shared/dtos/category.dto';
import {
  InstanceContentAddQueryDto,
  InstanceContentDto,
  InstanceContentQueryDto,
  InstanceDto,
  InstanceQueryDto,
} from '@shared/dtos/instance.dto';
import { Mutex } from 'async-mutex';
import { CurseForgeModLoaderType } from 'curseforge-api';
import dayjs from 'dayjs';
import { mkdir, readdir, readFile, rm, writeFile } from 'fs/promises';
import orderBy from 'lodash/orderBy';
import pLimit from 'p-limit';
import path from 'path';

import { NotFoundException } from '~/common/filters/exception.filter';
import { logger } from '~/common/logger';

import { appService } from '../app/app.service';
import { contentService } from '../content/content.service';
import { curseForgeService } from '../curseforge/curseforge.service';

export const instanceService = new (class InstanceService {
  private readonly FILE_NAME = 'instance.json';
  private instanceDirCache: string = null!;
  private instanceLocks = new Map<string, Mutex>();

  async findAll(payload: InstanceQueryDto): Promise<InstanceDto[]> {
    const { sortBy, sortDir } = payload;

    const instanceDir = await this.getInstanceDir();
    const dirs = (await readdir(instanceDir, { withFileTypes: true })).filter((d) => d.isDirectory());

    const limiter = pLimit(5);

    const instances = (
      await Promise.all(
        dirs.map((dir) =>
          limiter(async () => {
            const filePath = path.join(instanceDir, dir.name, this.FILE_NAME);
            try {
              const jsonString = await readFile(filePath, 'utf-8');
              return JSON.parse(jsonString);
            } catch {
              logger(`Failed to read instance ${dir.name}:`);
              return null;
            }
          }),
        ),
      )
    ).filter((inst): inst is InstanceDto => inst !== null);

    const sorted = orderBy(
      instances,
      [
        (inst) => {
          const value = inst[sortBy];
          if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
            return dayjs(value).valueOf();
          }
          return value?.toString().toLowerCase() ?? '';
        },
      ],
      [sortDir],
    );

    return sorted;
  }

  async findOne(id: string): Promise<InstanceDto> {
    if (!id) throw new NotFoundException('Id is required');

    const filePath = path.join(await this.getInstanceDir(), id, this.FILE_NAME);
    try {
      const jsonString = await readFile(filePath, 'utf-8');
      return JSON.parse(jsonString);
    } catch (err) {
      throw new NotFoundException(`Instance with id ${id} not found`);
    }
  }

  async create(instance: InstanceDto) {
    const lock = this.getInstanceLock(instance.id);

    return lock.runExclusive(async () => {
      const fileDir = path.join(await this.getInstanceDir(), instance.id);
      const filePath = path.join(fileDir, this.FILE_NAME);

      await mkdir(fileDir, { recursive: true });
      await writeFile(filePath, JSON.stringify(instance, null, 2), 'utf-8');
      return instance;
    });
  }

  async update(instance: InstanceDto) {
    const { id } = instance;
    const existing = await this.findOne(id);

    const lock = this.getInstanceLock(id);

    return lock.runExclusive(async () => {
      const filePath = path.join(await this.getInstanceDir(), id, this.FILE_NAME);
      const updated = { ...existing, ...instance };
      await writeFile(filePath, JSON.stringify(updated, null, 2), 'utf-8');
      return updated;
    });
  }

  async delete(id: string) {
    const existing = await this.findOne(id);

    const lock = this.getInstanceLock(id);

    return lock.runExclusive(async () => {
      const fileDir = path.join(await this.getInstanceDir(), id);
      await rm(fileDir, { recursive: true, force: true });
      return existing;
    });
  }

  async getContents(payload: InstanceContentQueryDto) {
    const { id, contentType } = payload;
    const instance = await this.findOne(id);

    const contentIds = (instance[contentType]?.map((c) => c.id) ?? []).join(',');

    const contents = await contentService.findAll({ instance: id, ids: contentIds });
    return contents;
  }

  async addContents(payload: InstanceContentAddQueryDto) {
    const { id: instanceId, contentType, contentId } = payload;
    const worlds = payload.worlds?.split(',') ?? [];

    const lock = this.getInstanceLock(instanceId);

    return lock.runExclusive(async () => {
      const instance = await this.findOne(instanceId);

      const groupedContents: Record<string, InstanceContentDto[]> = {};
      const visited = new Map<number, InstanceContentDto>();

      const resolveDependencies = async (id: number, gameVersion: string, parentType?: number) => {
        if (visited.has(id)) return visited.get(id);

        const contentInfo = await curseForgeService.getMods([id]).then((res) => (res.length ? res[0] : null));
        if (!contentInfo) return null;

        const mappedType = contentInfo.classId ? categoryMap.idToText[contentInfo.classId] : undefined;
        const realType = mappedType ? mappedType.toLowerCase().replace(/\s+/g, '') : (parentType ?? contentType);

        const loader = realType === 'mods' ? CurseForgeModLoaderType[instance.loader!.type] : undefined;

        const contentFile = await contentService
          .findFiles({ id: id, gameVersion, modLoaderType: loader })
          .then((res) => (res.data.length ? res.data[0] : null));
        if (!contentFile) return null;

        const instanceContent: InstanceContentDto = {
          id: contentInfo.id,
          name: contentInfo.name,
          fileId: contentFile.id,
          fileName: contentFile.fileName,
          fileUrl: contentFile.downloadUrl,
          fileLength: contentFile.fileLength,
          enabled: false,
          dependencies: [],
        };

        visited.set(id, instanceContent);

        if (!groupedContents[realType]) groupedContents[realType] = [];
        groupedContents[realType].push(instanceContent);

        if (contentFile.dependencies.length) {
          const deps = await Promise.all(
            contentFile.dependencies
              .filter((dep) => dep.relationType === 3)
              .map(async (dep) => {
                const depContent = await resolveDependencies(dep.modId, gameVersion, realType);
                return depContent?.id;
              }),
          );
          instanceContent.dependencies = deps.filter((d): d is number => d !== undefined && d !== null);
        }

        return instanceContent;
      };

      await resolveDependencies(contentId, instance.version);

      for (const [type, newContents] of Object.entries(groupedContents)) {
        const existingContents = instance[type] ?? [];
        instance[type] = [
          ...existingContents.filter((c: InstanceContentDto) => !newContents.some((n) => n.id === c.id)),
          ...newContents,
        ];
      }

      await this.update(instance);
    });
  }

  private getInstanceLock(id: string) {
    if (!this.instanceLocks.has(id)) {
      this.instanceLocks.set(id, new Mutex());
    }
    return this.instanceLocks.get(id)!;
  }

  private async getInstanceDir() {
    if (!this.instanceDirCache) this.instanceDirCache = (await appService.getConfig()).minecraft.gameDir;
    return this.instanceDirCache;
  }
})();
