import { CATEGORY_CLASS_REVERSED } from '@shared/constants/curseforge.const';
import { categoryMap } from '@shared/dtos/category.dto';
import { ContentDto } from '@shared/dtos/content.dto';
import {
  InstanceContentAddQueryDto,
  InstanceContentDownloadQueryDto,
  InstanceContentDto,
  InstanceContentQueryDto,
  InstanceContentRemoveQueryDto,
  InstanceContentRemoveResponseDto,
  InstanceContentToggleQueryDto,
  InstanceContentType,
  InstanceDto,
  InstanceQueryDto,
  InstanceWorldDto,
} from '@shared/dtos/instance.dto';
import AdmZip from 'adm-zip';
import { Mutex } from 'async-mutex';
import { spawn } from 'child_process';
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
import { parse } from 'prismarine-nbt';

import { BadRequestException, NotFoundException } from '~/common/filters/exception.filter';
import { logger } from '~/common/logger';
import { Launch, Mojang } from '~/libraries/minecraft-java-core/build/Index';
import { LaunchOPTS } from '~/libraries/minecraft-java-core/build/Launch';
import { BundleItem } from '~/libraries/minecraft-java-core/build/Minecraft/Minecraft-Bundle';
import Downloader, { DownloadOptions } from '~/libraries/minecraft-java-core/build/utils/Downloader';

import { appService } from '../app/app.service';
import { contentService } from '../content/content.service';
import { curseForgeService } from '../curseforge/curseforge.service';

export const instanceService = new (class InstanceService {
  private readonly FILE_NAME = 'instance.json';
  private instanceDirCache: string = null!;
  private instanceLocks = new Map<string, Mutex>();
  private readonly DELAY_MS = 500;
  private instanceLaunch = new Map<string, Launch>();
  private instanceLaunchEvent = new Map<string, EventEmitter>();

  async findAll(payload: InstanceQueryDto): Promise<InstanceDto[]> {
    const { sortBy, sortDir } = payload;

    const instanceDir = await this.getInstanceDir();
    const dirs = (await readdir(instanceDir, { withFileTypes: true }).catch(() => [])).filter((d) => d.isDirectory());

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

    const existing = await this.findOne(instance.id).catch(() => null);
    if (existing) throw new BadRequestException(`Instance already exists`);

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

  async getWorlds(id: string) {
    if (!id) throw new NotFoundException('Id is required');

    const worldDir = await this.getContentDir(id, InstanceContentType.WORLDS);
    const dirs = await readdir(worldDir, { withFileTypes: true });

    const limit = pLimit(5);

    const tasks = dirs
      .filter((dir) => dir.isDirectory())
      .map((dir) =>
        limit(async () => {
          const levelDatPath = path.join(worldDir, dir.name, 'level.dat');
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
              gameType: data.GameType?.value ?? null,
              path: path.join(worldDir, dir.name),
            };

            return result;
          } catch (err) {
            logger(`Failed to read world ${dir.name}/level.dat:`, err);
            return null;
          }
        }),
      );

    const worlds = (await Promise.all(tasks)).filter((w): w is InstanceWorldDto => w !== null);
    return worlds;
  }

  async openFolder(id: string) {
    try {
      const instanceDir = path.join(await this.getInstanceDir(), id);

      const platform = process.platform;
      let command: string;
      let args: string[] = [];
      if (platform === 'win32') {
        command = 'explorer';
        args = [instanceDir.replace(/\//g, '\\')];
      } else if (platform === 'darwin') {
        command = 'open';
        args = [instanceDir];
      } else {
        command = 'xdg-open';
        args = [instanceDir];
      }
      const child = spawn(command, args, { detached: true, stdio: 'ignore' });
      child.unref();
      return { message: 'Folder opened successfully' };
    } catch (err) {
      logger(`Failed to open folder for instance ${id}:`, err);
      throw new BadRequestException('Failed to open folder');
    }
  }

  async launch(id: string) {
    const [instance, config] = await Promise.all([this.findOne(id), appService.getConfig()]);

    try {
      if (this.instanceLaunch.has(id)) return this.instanceLaunchEvent.get(id);

      this.update({ ...instance, lastPlayed: new Date().toISOString() }).catch(logger);

      const launch = new Launch();
      const eventEmitter = new EventEmitter();

      this.instanceLaunch.set(id, launch);
      this.instanceLaunchEvent.set(id, eventEmitter);

      const auth = await Mojang.login(config.auth.username);

      const opts: LaunchOPTS = {
        path: config.minecraft.gameDir,
        version: instance.version,
        bypassOffline: true,
        authenticator: auth,
        loader: {
          path: '.',
          type: instance.loader ? CurseForgeModLoaderType[instance.loader.type].toLowerCase() : undefined,
          build: instance.loader?.version ?? 'latest',
          enable: !!instance.loader,
        },
        instance: path.join('..', 'versions', id),
        mcp: undefined,
        verify: false,
        ignored: [],
        java: config.minecraft.java,
        screen: config.minecraft.screen,
        memory: {
          min: `${config.minecraft.memory.min}M`,
          max: `${config.minecraft.memory.max}M`,
        },
        downloadFileMultiple: config.downloadMultiple,
        JVM_ARGS: [],
        GAME_ARGS: [],
      };

      const contentFiles = await this.getContentFiles(instance);

      launch.Launch(opts, contentFiles);

      launch
        .on(
          'progress',
          throttle((p, s) => {
            const percent = ((p / s) * 100).toFixed(2);
            this.instanceLaunchEvent.get(id)?.emit('progress', percent);
          }, this.DELAY_MS),
        )
        .on(
          'data',
          throttle((l) => this.instanceLaunchEvent.get(id)?.emit('log', l), this.DELAY_MS),
        )
        .on(
          'speed',
          throttle((s) => {
            if (typeof s === 'number' && !isNaN(s) && isFinite(s) && s > 0) {
              const speedMB = (s / 1024 / 1024).toFixed(2);
              this.instanceLaunchEvent.get(id)?.emit('speed', `${speedMB}MB/s`);
            }
          }, this.DELAY_MS),
        )
        .on(
          'estimated',
          throttle((e) => {
            if (typeof e === 'number' && !isNaN(e) && isFinite(e) && e > 0) {
              const m = Math.floor(e / 60);
              const s = Math.floor(e % 60);
              this.instanceLaunchEvent.get(id)?.emit('estimated', `${m}m ${s}s`);
            }
          }, this.DELAY_MS),
        )
        .on(
          'extract',
          throttle((e) => this.instanceLaunchEvent.get(id)?.emit('extract', e), this.DELAY_MS),
        )
        .on(
          'patch',
          throttle((p) => this.instanceLaunchEvent.get(id)?.emit('patch', p), this.DELAY_MS),
        )
        .on('close', () => {
          this.instanceLaunchEvent.get(id)?.emit('close');
          this.launchCleanup(id);
        })
        .on('cancelled', () => {
          this.instanceLaunchEvent.get(id)?.emit('cancelled');
          this.launchCleanup(id);
        })
        .on('error', (err) => {
          this.instanceLaunchEvent.get(id)?.emit('error', err);
          this.launchCleanup(id);
        });

      return eventEmitter;
    } catch (err) {
      this.launchCleanup(id);
      logger(err);
      return null;
    }
  }

  async cancel(id: string) {
    try {
      this.instanceLaunch.get(id)?.cancel();
      this.launchCleanup(id);
      return true;
    } catch (err) {
      logger(err);
      this.launchCleanup(id);
      return false;
    }
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
    const { id: instanceId, contentType, contentId, fileId } = payload;
    const worlds = payload.worlds?.split(',') ?? [];

    const lock = this.getInstanceLock(instanceId, 'addContent');

    return lock.runExclusive(async () => {
      const instance = await this.findOne(instanceId);

      const groupedContents: Record<string, InstanceContentDto[]> = {};
      const visited = new Map<number, InstanceContentDto>();

      const resolveDependencies = async (id: number, gameVersion: string, parentType?: string, fileId?: number) => {
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
        const realType: string = mappedType
          ? mappedType.toLowerCase().replace(/\s+/g, '')
          : (parentType ?? contentType);

        const loader = realType === CATEGORY_CLASS_REVERSED[6].toLowerCase() ? instance.loader?.type : undefined;

        const contentFile = fileId
          ? await contentService.findFile({ id, fileId })
          : await contentService
              .findFiles({ id, gameVersion, modLoaderType: loader })
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
          hash: contentFile.hash,
          dependencies: [],
        };

        visited.set(id, instanceContent);

        // Add to groupedContents since this is a new dependency
        if (!groupedContents[realType]) groupedContents[realType] = [];
        groupedContents[realType].push(instanceContent);

        if (contentFile?.dependencies?.length) {
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

      await resolveDependencies(contentId, instance.version, undefined, fileId);

      for (const [type, newContents] of Object.entries(groupedContents)) {
        const existingContents = instance[type] ?? [];
        instance[type] = [
          ...existingContents.filter((c: InstanceContentDto) => !newContents.some((n) => n.id === c.id)),
          ...newContents,
        ];
      }

      await this.update(instance);

      return this.handleDownloadContents({ groupedContents, instanceId, worlds });
    });
  }

  async removeContents(payload: InstanceContentRemoveQueryDto) {
    const { id: instanceId, contentType, contentIds } = payload;

    const lock = this.getInstanceLock(instanceId, 'removeContent');

    return lock.runExclusive(async () => {
      const [instance, contentDir] = await Promise.all([
        this.findOne(instanceId),
        this.getContentDir(instanceId, contentType),
      ]);

      const contentIdsSet = new Set(contentIds);
      const contentsToRemove = (instance[contentType] ?? []).filter((c) => contentIdsSet.has(c.id));

      if (contentsToRemove.length === 0) {
        throw new NotFoundException(`No contents found with provided IDs in instance ${instanceId}`);
      }

      await Promise.all(
        contentsToRemove.map(async (content) => {
          const filePath = path.join(contentDir, content.fileName);
          const fileDisabledPath = filePath + '.disabled';

          try {
            await rm(filePath, { force: true });
            await rm(fileDisabledPath, { force: true });
          } catch (err: any) {
            if (err.code !== 'ENOENT') throw err;
          }
        }),
      );

      instance[contentType] = instance[contentType]?.filter((c) => !contentIdsSet.has(c.id)) ?? [];
      await this.update(instance);

      return {
        message: 'Removed successfully',
        data: contentsToRemove.map((c) => ({
          id: c.id,
          fileName: c.fileName,
        })),
      } as InstanceContentRemoveResponseDto;
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

  private getInstanceLock(id: string, action = 'default') {
    const key = `${id}:${action}`;
    if (!this.instanceLocks.has(key)) {
      this.instanceLocks.set(key, new Mutex());
    }
    return this.instanceLocks.get(key)!;
  }

  private async getInstanceDir() {
    if (!this.instanceDirCache) {
      this.instanceDirCache = path.resolve((await appService.getConfig()).minecraft.gameDir, 'versions');
    }
    return this.instanceDirCache;
  }

  private async getContentDir(instanceId: string, type: string, worldName?: string) {
    const baseDir = path.join(await this.getInstanceDir(), instanceId);

    let fullDir: string;

    if (
      type === InstanceContentType.MODS ||
      type === InstanceContentType.RESOURCEPACKS ||
      type === InstanceContentType.SHADERPACKS
    ) {
      fullDir = path.join(baseDir, type);
    } else if (type === InstanceContentType.DATAPACKS) {
      if (!worldName) throw new BadRequestException('World name is required for datapacks');
      fullDir = path.join(baseDir, 'saves', worldName, type);
    } else if (type === InstanceContentType.WORLDS) {
      fullDir = path.join(baseDir, 'saves');
    } else {
      throw new BadRequestException('Invalid content type');
    }
    return fullDir;
  }

  private async handleDownloadContents(payload: InstanceContentDownloadQueryDto) {
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
                  event.emit('extract', `Extracting ${path.basename(file.path)}`);
                } catch {
                  logger(`Failed to extract ${path.basename(file.path)}`);
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
          if (typeof s === 'number' && !isNaN(s) && isFinite(s) && s > 0) {
            const speedMB = (s / 1024 / 1024).toFixed(2);
            event.emit('speed', `${speedMB}MB/s`);
          }
        }, this.DELAY_MS),
      )
      .on(
        'estimated',
        throttle((e) => {
          if (typeof e === 'number' && !isNaN(e) && isFinite(e) && e > 0) {
            const m = Math.floor(e / 60);
            const s = Math.floor(e % 60);
            event.emit('estimated', `${m}m ${s}s`);
          }
        }, this.DELAY_MS),
      )
      .on('error', (err) => event.emit('error', err));

    return event;
  }

  private async prepareDownloadOptions(payload: InstanceContentDownloadQueryDto) {
    const { groupedContents, instanceId, worlds } = payload;

    const filesToDownload: DownloadOptions[] = [];

    for (const [type, contents] of Object.entries(groupedContents)) {
      if (type === InstanceContentType.DATAPACKS && Array.isArray(worlds) && worlds.length) {
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

  private launchCleanup(id: string) {
    const launch = this.instanceLaunch.get(id);
    const event = this.instanceLaunchEvent.get(id);
    if (launch) {
      launch.removeAllListeners();
      this.instanceLaunch.delete(id);
    }
    if (event) {
      event.removeAllListeners();
      this.instanceLaunchEvent.delete(id);
    }
  }

  private async getContentFiles(instance: InstanceDto): Promise<BundleItem[]> {
    const bundleItems: BundleItem[] = [];
    const types = [CATEGORY_CLASS_REVERSED[6], CATEGORY_CLASS_REVERSED[12], CATEGORY_CLASS_REVERSED[6552]].map((t) =>
      t.toLowerCase().replace(/\s+/g, ''),
    );

    for (const type of types) {
      const contents: InstanceContentDto[] | undefined = instance[type];
      if (!contents?.length) continue;

      const dir = await this.getContentDir(instance.id, type);

      for (const c of contents) {
        bundleItems.push({
          path: path.join(dir, c.fileName),
          sha1: c.hash,
          size: c.fileLength,
          url: c.fileUrl,
        });
      }
    }

    return bundleItems;
  }
})();
