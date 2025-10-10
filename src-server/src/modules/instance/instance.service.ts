import { categoryMap } from '@shared/dtos/category.dto';
import { ContentDto } from '@shared/dtos/content.dto';
import {
  INSTANCE_CONTENT_TYPE,
  InstanceContentAddQueryDto,
  InstanceContentDownloadQueryDto,
  InstanceContentDto,
  InstanceContentQueryDto,
  InstanceContentRemoveQueryDto,
  InstanceContentToggleQueryDto,
  InstanceDto,
  InstanceQueryDto,
} from '@shared/dtos/instance.dto';
import AdmZip from 'adm-zip';
import { Mutex } from 'async-mutex';
import { CurseForgeModLoaderType } from 'curseforge-api';
import { CurseForgePagination } from 'curseforge-api/v1/Types';
import dayjs from 'dayjs';
import EventEmitter from 'events';
import { existsSync } from 'fs';
import { mkdir, readdir, readFile, rename, rm, stat, writeFile } from 'fs/promises';
import orderBy from 'lodash/orderBy';
import throttle from 'lodash/throttle';
import pLimit from 'p-limit';
import path from 'path';

import { BadRequestException, NotFoundException } from '~/common/filters/exception.filter';
import { logger } from '~/common/logger';
import Downloader, { DownloadOptions } from '~/libraries/minecraft-java-core/build/utils/Downloader';

import { appService } from '../app/app.service';
import { contentService } from '../content/content.service';
import { curseForgeService } from '../curseforge/curseforge.service';

export const instanceService = new (class InstanceService {
  private readonly FILE_NAME = 'instance.json';
  private instanceDirCache: string = null!;
  private instanceLocks = new Map<string, Mutex>();
  private readonly DELAY_MS = 500;

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

    if (!contentIds)
      return {
        data: [] as ContentDto[],
        pagination: { index: 0, pageSize: 0, resultCount: 0, totalCount: 0 } as CurseForgePagination,
      };

    const contents = await contentService.findAll({ instance: id, ids: contentIds });
    return contents;
  }

  async addContents(payload: InstanceContentAddQueryDto) {
    const { id: instanceId, contentType, contentId } = payload;
    const worlds = payload.worlds?.split(',') ?? [];

    const lock = this.getInstanceLock(instanceId, 'addContent');

    return lock.runExclusive(async () => {
      const instance = await this.findOne(instanceId);

      const groupedContents: Record<string, InstanceContentDto[]> = {};
      const visited = new Map<number, InstanceContentDto>();

      const resolveDependencies = async (id: number, gameVersion: string, parentType?: number) => {
        if (visited.has(id)) return visited.get(id);

        const existingContent = Object.values(instance)
          .flat()
          .find((c: any) => c?.id === id) as InstanceContentDto;

        if (existingContent) {
          visited.set(id, existingContent);
          return existingContent;
        }

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
          enabled: true,
          dependencies: [],
        };

        visited.set(id, instanceContent);

        // Add to groupedContents since this is a new dependency
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

      return this.downloadContents({ groupedContents, instanceId, worlds });
    });
  }

  async removeContents(payload: InstanceContentRemoveQueryDto) {
    const { id: instanceId, contentType, contentId } = payload;

    const lock = this.getInstanceLock(instanceId, 'removeContent');

    return lock.runExclusive(async () => {
      const [instance, contentDir] = await Promise.all([
        this.findOne(instanceId),
        this.getContentDir(instanceId, contentType),
      ]);

      const content = instance[contentType]?.find((c) => c.id === contentId);
      if (!content) throw new NotFoundException(`Content with id ${contentId} not found in instance ${instanceId}`);

      const filePath = path.join(contentDir, content.fileName);
      const fileDisabledPath = filePath + '.disabled';

      try {
        await rm(filePath, { force: true });
        await rm(fileDisabledPath, { force: true });
      } catch (err: any) {
        if (err.code !== 'ENOENT') throw err;
      }

      instance[contentType] = instance[contentType]?.filter((c) => c.id !== contentId) ?? [];
      await this.update(instance);

      return {
        message: 'Removed successfully',
        data: {
          id: contentId,
          fileName: content.fileName,
        },
      };
    });
  }

  async toggleContents(payload: InstanceContentToggleQueryDto) {
    const { id: instanceId, contentType, contentIds, enable } = payload;

    const lock = this.getInstanceLock(instanceId, 'toggleContent');

    return lock.runExclusive(async () => {
      const [instance, contentDir] = await Promise.all([
        this.findOne(instanceId),
        this.getContentDir(instanceId, contentType),
      ]);

      const toggleSet = new Set(contentIds);

      const updatedContents = await Promise.all(
        (instance[contentType] ?? []).map(async (content) => {
          if (!toggleSet.has(content.id)) return content;

          const shouldEnable = enable ?? !content.enabled;
          const filePath = path.join(contentDir, content.fileName);
          const fileDisabledPath = filePath + '.disabled';

          try {
            if (shouldEnable && existsSync(fileDisabledPath)) {
              await rename(fileDisabledPath, filePath);
            } else if (!shouldEnable && existsSync(filePath)) {
              await rename(filePath, fileDisabledPath);
            }
          } catch (err: any) {
            throw new BadRequestException(`Failed to toggle content ${content.id} in instance ${instanceId}`);
          }
          return { ...content, enabled: shouldEnable };
        }),
      );

      instance[contentType] = updatedContents;
      await this.update(instance);

      return { message: 'Toggled successfully' };
    });
  }

  async downloadContents(payload: InstanceContentDownloadQueryDto) {
    const [config, filesToDownload] = await Promise.all([appService.getConfig(), this.prepareDownloadOptions(payload)]);

    if (!filesToDownload.length) return null;

    const totalSize = filesToDownload.reduce((acc, f) => acc + (f.length ?? 0), 0);
    const event = new EventEmitter();
    const downloader = new Downloader();

    downloader.downloadFileMultiple(filesToDownload, totalSize, config.downloadMultiple);

    downloader
      .on(
        'progress',
        throttle(async (p, s) => {
          const percent = ((p / s) * 100).toFixed(2);
          event.emit('progress', percent);
          if (p >= s) {
            for (const file of filesToDownload) {
              if (file.type === 'worlds' && file.path.endsWith('.zip')) {
                try {
                  const zip = new AdmZip(file.path);
                  zip.extractAllTo(file.folder, true);
                  // await unlink(file.path);
                  event.emit('extract', `Extracting ${path.basename(file.path)}`);
                } catch {
                  console.log(`Failed to extract ${path.basename(file.path)}`);
                }
              }
            }
            event.emit('done', 'Download complete');
          }
        }, this.DELAY_MS),
      )
      .on(
        'speed',
        throttle((s) => {
          const speedMB = (s / 1024 / 1024).toFixed(2);
          event.emit('speed', `${speedMB}MB/s`);
        }, this.DELAY_MS),
      )
      .on(
        'estimated',
        throttle((e) => {
          const m = Math.floor(e / 60);
          const s = Math.floor(e % 60);
          event.emit('estimated', `${m}m ${s}s`);
        }, this.DELAY_MS),
      )
      .on('error', (err) => event.emit('error', err));

    return event;
  }

  private getInstanceLock(id: string, action = 'default') {
    const key = `${id}:${action}`;
    if (!this.instanceLocks.has(key)) {
      this.instanceLocks.set(key, new Mutex());
    }
    return this.instanceLocks.get(key)!;
  }

  private async getInstanceDir() {
    if (!this.instanceDirCache) this.instanceDirCache = (await appService.getConfig()).minecraft.gameDir;
    return this.instanceDirCache;
  }

  private async getContentDir(instanceId: string, type: string, worldName?: string) {
    const baseDir = path.join(await this.getInstanceDir(), instanceId);

    let fullDir: string;

    if (
      type === INSTANCE_CONTENT_TYPE.MODS ||
      type === INSTANCE_CONTENT_TYPE.RESOURCEPACKS ||
      type === INSTANCE_CONTENT_TYPE.SHADERPACKS
    ) {
      fullDir = path.join(baseDir, type);
    } else if (type === INSTANCE_CONTENT_TYPE.DATAPACKS) {
      if (!worldName) throw new BadRequestException('World name is required for datapacks');
      fullDir = path.join(baseDir, 'saves', worldName, type);
    } else if (type === INSTANCE_CONTENT_TYPE.WORLDS) {
      fullDir = path.join(baseDir, 'saves');
    } else {
      throw new BadRequestException('Invalid content type');
    }
    return fullDir;
  }

  private async prepareDownloadOptions(payload: InstanceContentDownloadQueryDto) {
    const { groupedContents, instanceId, worlds } = payload;

    const filesToDownload: DownloadOptions[] = [];

    for (const [type, contents] of Object.entries(groupedContents)) {
      if (type === INSTANCE_CONTENT_TYPE.DATAPACKS && Array.isArray(worlds) && worlds.length) {
        for (const worldName of worlds) {
          const pathDir = await this.getContentDir(instanceId, type, worldName);

          for (const c of contents) {
            const filePath = path.join(pathDir, c.fileName);
            if (await this.checkNeedDownload(filePath, c.fileLength)) {
              filesToDownload.push({
                url: c.fileUrl,
                path: filePath,
                folder: pathDir,
                length: c.fileLength,
                type,
              });
            }
          }
        }
      } else {
        const pathDir = await this.getContentDir(instanceId, type);

        for (const c of contents) {
          const filePath = path.join(pathDir, c.fileName);
          if (await this.checkNeedDownload(filePath, c.fileLength)) {
            filesToDownload.push({
              url: c.fileUrl,
              path: filePath,
              folder: pathDir,
              length: c.fileLength,
              type,
            });
          }
        }
      }
    }

    return filesToDownload;
  }

  private async checkNeedDownload(filePath: string, expectedSize: number): Promise<boolean> {
    if (existsSync(filePath)) {
      try {
        const fileStat = await stat(filePath);
        return fileStat.size !== expectedSize;
      } catch {
        return true;
      }
    }
    return true;
  }
})();
