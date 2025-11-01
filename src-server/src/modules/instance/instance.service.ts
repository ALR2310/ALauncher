import { ContentResponseDto } from '@shared/dtos/content.dto';
import {
  InstanceContentAddQueryDto,
  InstanceContentDownloadQueryDto,
  InstanceContentDto,
  InstanceContentQueryDto,
  InstanceContentRemoveQueryDto,
  InstanceContentRemoveResponseDto,
  InstanceContentToggleQueryDto,
  InstanceContentToggleResponseDto,
  InstanceDto,
  InstanceQueryDto,
  instanceSchema,
  InstanceWorldDto,
} from '@shared/dtos/instance.dto';
import { CategoryClassEnum, InstanceContentEnum } from '@shared/enums/general.enum';
import { Mutex } from 'async-mutex';
import { spawn } from 'child_process';
import { createHash } from 'crypto';
import { CurseForgeFileRelationType, CurseForgeModLoaderType } from 'curseforge-api';
import EventEmitter from 'events';
import { createReadStream, existsSync } from 'fs';
import { access, constants, mkdir, readdir, readFile, rename, rm, stat, writeFile } from 'fs/promises';
import throttle from 'lodash/throttle';
import pLimit from 'p-limit';
import path from 'path';
import { parse } from 'prismarine-nbt';
import unzipper from 'unzipper';

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
  private instanceDirCache: string | null = null;
  private instanceLocks = new Map<string, Mutex>();
  private instanceLaunch = new Map<string, Launch>();
  private instanceLaunchEvent = new Map<string, EventEmitter>();
  private readonly DELAY_MS = 500;

  async findAll(payload: InstanceQueryDto): Promise<InstanceDto[]> {
    const { sortBy, sortDir } = payload;

    try {
      const instanceDir = await this.instanceDir();
      const folders = await readdir(instanceDir, { withFileTypes: true });
      const limiter = pLimit(10);

      const readTasks = folders
        .filter((f) => f.isDirectory())
        .map((dir) =>
          limiter(async () => {
            const instancePath = await this.instancePath(dir.name);
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
      const instancePath = await this.instancePath(id);
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

      const instanceDir = await this.instanceDir(instance.id);
      const instancePath = await this.instancePath(instance.id);

      await mkdir(instanceDir, { recursive: true });
      await writeFile(instancePath, JSON.stringify(instance, null, 2), 'utf-8');
      return instance;
    } catch (err: any) {
      throw new NotFoundException(`Failed to create instance: ${err.message}`);
    }
  }

  async update(id: string, data: Partial<InstanceDto>): Promise<InstanceDto> {
    try {
      const instanceDir = await this.instanceDir();
      const instancePath = await this.instancePath(id);
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

      const instanceDir = await this.instanceDir(id);
      await rm(instanceDir, { recursive: true, force: true });
      return existing;
    } catch (err: any) {
      throw new BadRequestException(`Failed to delete instance: ${err.message}`);
    }
  }

  async getWorlds(id: string): Promise<InstanceWorldDto[]> {
    if (!id) throw new NotFoundException('Instance ID is required');

    try {
      const instanceDir = await this.instanceDir(id);
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

  async openFolder(id: string): Promise<{ message: string }> {
    try {
      const instanceDir = await this.instanceDir(id);

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
    } catch (err: any) {
      throw new BadRequestException(`Failed to open folder: ${err.message}`);
    }
  }

  async launch(id: string) {
    const [instance, config] = await Promise.all([this.findOne(id), appService.getConfig()]);

    if (this.instanceLaunch.has(id)) return this.instanceLaunchEvent.get(id);

    // Update metadata
    this.update(id, { lastPlayed: new Date().toISOString() });

    const launch = new Launch();
    const event = new EventEmitter();

    this.instanceLaunch.set(id, launch);
    this.instanceLaunchEvent.set(id, event);

    const opts: LaunchOPTS = {
      path: config.minecraft.gameDir,
      version: instance.version,
      bypassOffline: true,
      authenticator: await Mojang.login(config.auth.username),
      loader: {
        path: '.',
        type: instance.loader ? CurseForgeModLoaderType[instance.loader.type].toLowerCase() : undefined,
        build: instance.loader?.build ?? 'latest',
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

    const bundleItems = await this.buildBundleItems(instance);

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

    launch.Launch(opts, bundleItems);

    return event;
  }

  async cancel(id: string) {
    const launch = this.instanceLaunch.get(id);
    if (!launch) throw new NotFoundException('No active launch found for this instance');
    launch.cancel();
    return { message: 'Launch cancelled successfully' };
  }

  async getContents(payload: InstanceContentQueryDto): Promise<ContentResponseDto> {
    const { id, contentType } = payload;

    const instance = await this.findOne(id);

    const contentIds = (instance[contentType]?.map((c) => c.id) || []).join(',');

    if (!contentIds)
      return {
        data: [],
        pagination: { index: 0, pageSize: 0, resultCount: 0, totalCount: 0 },
      };

    return await contentService.findAll({
      instance: id,
      ids: contentIds,
    });
  }

  async addContents(payload: InstanceContentAddQueryDto) {
    const { id: instanceId, contentId, fileId, worlds } = payload;

    const lock = this.instanceLock(instanceId);

    return lock.runExclusive(async () => {
      const instance = await this.findOne(instanceId);
      const gameVersion = instance.version;

      const grouped: Partial<Record<InstanceContentEnum, InstanceContentDto[]>> = {};
      const visited = new Map<number, InstanceContentDto>();

      await this.resolveContentDependencies({ cid: contentId, gameVersion, fileId, instance, visited, grouped });

      for (const [type, contents] of Object.entries(grouped) as [InstanceContentEnum, InstanceContentDto[]][]) {
        if (!Array.isArray(instance[type])) instance[type] = [];
        for (const content of contents) {
          const index = instance[type].findIndex((c) => c.id === content.id);
          if (index !== -1) {
            const existing = instance[type][index];
            if (existing.fileId !== content.fileId) {
              await this.resolveContentExisting(instanceId, type, existing, worlds);
            }
            instance[type][index] = content;
          } else {
            instance[type].push(content);
          }
        }
      }

      this.update(instanceId, instance);
      return this.downloadContents({ id: instanceId, grouped, worlds });
    });
  }

  async removeContents(payload: InstanceContentRemoveQueryDto): Promise<InstanceContentRemoveResponseDto> {
    const { id: instanceId, contentType, contentIds } = payload;
    const lock = this.instanceLock(instanceId);

    return lock.runExclusive(async () => {
      const instance = await this.findOne(instanceId);

      const contents = instance[contentType];
      if (!Array.isArray(contents) || !contents.length) {
        return {
          message: `No ${contentType} found in instance`,
          data: [],
        };
      }

      const toRemove = contents.filter((c) => contentIds.includes(c.id));
      if (!toRemove.length) {
        return {
          message: `No matching contents found in ${contentType}`,
          data: [],
        };
      }

      for (const content of toRemove) {
        await this.resolveContentExisting(instanceId, contentType, content);
      }

      instance[contentType] = contents.filter((c) => !contentIds.includes(c.id));
      await this.update(instanceId, instance);

      return {
        message: 'Contents removed successfully',
        data: toRemove,
      };
    });
  }

  async toggleContents(payload: InstanceContentToggleQueryDto) {
    const { id: instanceId, contentType, contentIds, enable } = payload;
    const lock = this.instanceLock(instanceId);

    return lock.runExclusive(async () => {
      const instance = await this.findOne(instanceId);
      const contents = instance[contentType];
      if (!Array.isArray(contents) || !contents.length)
        throw new NotFoundException(`No ${contentType} found in instance`);

      const toggled: InstanceContentDto[] = [];

      for (const content of contents) {
        if (!contentIds.includes(content.id)) continue;

        const currentEnabled = content.enabled;
        const targetEnabled = enable ?? !currentEnabled;
        if (currentEnabled === targetEnabled) continue;

        const contentDir = await this.contentDir(instanceId, contentType);
        const contentPath = path.join(contentDir, content.fileName);
        const disabledPath = `${contentPath}.disabled`;

        try {
          if (targetEnabled) {
            if (existsSync(disabledPath)) {
              await rename(disabledPath, contentPath);
            }
          } else {
            if (existsSync(contentPath)) {
              await rename(contentPath, disabledPath);
            }
          }

          content.enabled = targetEnabled;
          toggled.push(content);
        } catch (err) {
          logger(`Failed to toggle ${contentType} "${content.fileName}"`, err);
        }
      }

      await this.update(instanceId, instance);

      return {
        message: `Toggled ${toggled.length} ${contentType}(s) successfully`,
        data: toggled,
      } as InstanceContentToggleResponseDto;
    });
  }

  async checkContents() {}

  async downloadContents(payload: InstanceContentDownloadQueryDto) {
    const [config, fileDownloads] = await Promise.all([appService.getConfig(), this.buildDownloadList(payload)]);

    if (!fileDownloads.length) return null;

    const totalSize = fileDownloads.reduce((sum, file) => sum + (file.length || 0), 0);
    const downloader = new Downloader();
    const event = new EventEmitter();

    downloader.downloadFileMultiple(fileDownloads, totalSize, config.downloadMultiple);

    downloader
      .on(
        'progress',
        throttle(async (p, s) => {
          const percent = ((p / s) * 100).toFixed(2);
          event.emit('progress', percent);

          if (p >= s) {
            for (const file of fileDownloads) {
              if (file.type === InstanceContentEnum.Worlds && file.path.endsWith('.zip')) {
                try {
                  const folder = file.folder;
                  await mkdir(folder, { recursive: true });

                  event.emit('extract', `Extracting ${path.basename(file.path)}`);

                  await new Promise<void>((resolve, reject) => {
                    createReadStream(file.path)
                      .pipe(unzipper.Extract({ path: folder }))
                      .on('close', resolve)
                      .on('error', reject);
                  });
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

  /**
   * Get the base directory for instances
   *
   * Example: `/path/to/minecraft/versions/<id>`
   */
  private async instanceDir(id?: string): Promise<string> {
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
  private async instancePath(id: string): Promise<string> {
    const instanceDir = await this.instanceDir();
    return path.resolve(instanceDir, id, 'instance.json');
  }

  /**
   * Get the directory for a specific content type within an instance
   *
   * Example: `/path/to/minecraft/versions/<id>/mods`
   */
  private async contentDir(instanceId: string, contentType: InstanceContentEnum, worldName?: string) {
    const instanceDir = await this.instanceDir(instanceId);
    let contentDir: string;

    if (contentType === InstanceContentEnum.DataPacks) {
      if (!worldName?.trim()) throw new BadRequestException('World name is required for datapacks');
      contentDir = path.resolve(instanceDir, InstanceContentEnum.Worlds, worldName, contentType);
    } else {
      contentDir = path.resolve(instanceDir, contentType);
    }

    return contentDir;
  }

  /**
   * Get a mutex lock for a specific instance
   */
  private instanceLock(id: string) {
    if (!this.instanceLocks.has(id)) {
      this.instanceLocks.set(id, new Mutex());
    }
    return this.instanceLocks.get(id)!;
  }

  private async resolveContentDependencies({
    cid,
    gameVersion,
    fileId,
    instance,
    visited,
    grouped,
  }: {
    cid: number;
    gameVersion: string;
    fileId?: number;
    instance: InstanceDto;
    visited: Map<number, InstanceContentDto>;
    grouped: Partial<Record<InstanceContentEnum, InstanceContentDto[]>>;
  }): Promise<InstanceContentDto | undefined> {
    if (visited.has(cid)) return visited.get(cid);

    const checkExisting = (instance: InstanceDto, fileId?: number) => {
      return Object.values(instance)
        .filter((v): v is InstanceContentDto[] => Array.isArray(v))
        .flat()
        .find((c) => c.id === cid && c.fileId === fileId);
    };

    if (fileId) {
      const existing = checkExisting(instance, fileId);
      if (existing) {
        visited.set(cid, existing);
        return existing;
      }
    }

    const contentInfo = await curseForgeService.getMods([cid]).then((res) => (res.length ? res[0] : null));
    if (!contentInfo) throw new NotFoundException(`Content not found`);

    const loader = contentInfo.classId === CategoryClassEnum.Mods ? instance.loader?.type : undefined;

    const contentFile = fileId
      ? await contentService.findFile({ id: cid, fileId })
      : await contentService
          .findFiles({ id: cid, gameVersion, modLoaderType: loader as number })
          .then((res) => (res.data.length ? res.data[0] : null));

    if (!contentFile) throw new NotFoundException(`Suitable file not found for "${contentInfo.name}"`);

    if (!fileId) {
      const existing = checkExisting(instance, contentFile.id);
      if (existing) {
        visited.set(cid, existing);
        return existing;
      }
    }

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

    visited.set(cid, instanceContent);

    const contentType = CategoryClassEnum[contentInfo.classId ?? 0].toLowerCase().replace(/\s+/g, '');

    (grouped[contentType] ??= []).push(instanceContent);

    if (contentFile.dependencies.length) {
      const deps = await Promise.all(
        contentFile.dependencies
          .filter((dep) => dep.modId !== cid && dep.relationType === CurseForgeFileRelationType.RequiredDependency)
          .map(async ({ modId }) => {
            const depContent = await this.resolveContentDependencies({
              cid: modId,
              gameVersion,
              instance,
              visited,
              grouped,
            });
            return depContent?.id;
          }),
      );
      instanceContent.dependencies = deps.filter(Boolean) as number[];
    }

    return instanceContent;
  }

  private async resolveContentExisting(
    instanceId: string,
    contentType: InstanceContentEnum,
    content: InstanceContentDto,
    worlds?: string[],
  ) {
    try {
      if (contentType === InstanceContentEnum.DataPacks) {
        if (!worlds?.length) return;

        await Promise.all(
          worlds.map(async (world) => {
            const datapackDir = await this.contentDir(instanceId, contentType, world);
            const datapackPath = path.join(datapackDir, content.fileName);
            const datapackPathDisabled = `${datapackPath}.disabled`;

            await Promise.all([rm(datapackPath, { force: true }), rm(datapackPathDisabled, { force: true })]);
            logger(`Removed old ${contentType}: "${content.fileName}" from "${datapackDir}"`);
          }),
        );
      } else {
        const contentDir = await this.contentDir(instanceId, contentType);
        const contentPath = path.join(contentDir, content.fileName);
        const contentPathDisabled = `${contentPath}.disabled`;

        await Promise.all([rm(contentPath, { force: true }), rm(contentPathDisabled, { force: true })]);
        logger(`Removed old ${contentType}: "${content.fileName}" from "${contentDir}"`);
      }
    } catch (err) {
      logger(`Failed to delete existing content "${content.fileName}":`, err);
    }
  }

  private async buildDownloadList(payload: InstanceContentDownloadQueryDto): Promise<DownloadOptions[]> {
    const { id: instanceId, grouped: groupedContents, worlds } = payload;
    const downloadList: DownloadOptions[] = [];

    for (const [type, contents] of Object.entries(groupedContents ?? {})) {
      if (!contents?.length) continue;

      if (type === InstanceContentEnum.DataPacks) {
        if (!worlds?.length) continue;
        for (const world of worlds) {
          const folder = await this.contentDir(instanceId, InstanceContentEnum.DataPacks, world);
          await mkdir(folder, { recursive: true });

          for (const item of contents) {
            const filePath = path.join(folder, item.fileName);
            const needDownload = await this.needDownload(filePath, item.hash);
            if (needDownload) {
              downloadList.push({
                url: item.fileUrl,
                path: filePath,
                length: item.fileLength,
                folder,
                type: InstanceContentEnum.DataPacks,
              });
            }
          }
        }
      } else {
        const folder = await this.contentDir(instanceId, type as InstanceContentEnum);
        await mkdir(folder, { recursive: true });

        for (const item of contents) {
          const filePath = path.join(folder, item.fileName);
          const needDownload = await this.needDownload(filePath, item.hash);
          if (needDownload) {
            downloadList.push({
              url: item.fileUrl,
              path: filePath,
              folder,
              length: item.fileLength,
              type,
            });
          }
        }
      }
    }

    return downloadList;
  }

  private async needDownload(filePath: string, expectedHash: string, algorithm = 'sha1'): Promise<boolean> {
    try {
      await access(filePath, constants.F_OK);
    } catch {
      return true;
    }

    return new Promise<boolean>((resolve) => {
      const hash = createHash(algorithm);
      const stream = createReadStream(filePath);

      stream.on('data', (chunk) => hash.update(chunk));
      stream.on('end', () => {
        const digest = hash.digest('hex');
        resolve(digest !== expectedHash);
      });
      stream.on('error', () => resolve(true));
    });
  }

  private async buildBundleItems(instance: InstanceDto): Promise<BundleItem[]> {
    const types = [InstanceContentEnum.Mods, InstanceContentEnum.ResourcePacks, InstanceContentEnum.ShaderPacks];

    const results = await Promise.all(
      types.map(async (type) => {
        const contents = instance[type];
        if (!Array.isArray(contents) || contents.length === 0) return [];

        const contentDir = await this.contentDir(instance.id, type);

        const validItems: BundleItem[] = [];

        await Promise.all(
          contents.map(async (content) => {
            const filePath = path.join(contentDir, content.fileName);

            try {
              const fileStat = await stat(filePath);
              if (fileStat.size !== content.fileLength) {
                validItems.push({
                  path: filePath,
                  sha1: content.hash,
                  size: content.fileLength,
                  url: content.fileUrl,
                  type,
                });
              }
            } catch {
              validItems.push({
                path: filePath,
                sha1: content.hash,
                size: content.fileLength,
                url: content.fileUrl,
                type,
              });
            }
          }),
        );

        return validItems;
      }),
    );

    return results.flat();
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
})();
