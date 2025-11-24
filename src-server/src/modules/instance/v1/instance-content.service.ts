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
} from '@shared/dtos/instance.dto';
import { CategoryClassEnum, InstanceContentEnum } from '@shared/enums/general.enum';
import { Mutex } from 'async-mutex';
import { CurseForgeFileRelationType } from 'curseforge-api';
import EventEmitter from 'events';
import { existsSync } from 'fs';
import { access, constants, mkdir, readdir, rename, rm, stat } from 'fs/promises';
import throttle from 'lodash/throttle';
import pLimit from 'p-limit';
import path from 'path';

import { NotFoundException } from '~/common/filters/exception.filter';
import { logger } from '~/common/logger';
import { Downloader } from '~/libraries/minecraft-java-core/build/Index';
import { DownloadOptions } from '~/libraries/minecraft-java-core/build/utils/Downloader';
import { Zipper } from '~/utils';
import { getFingerprints } from '~/utils/fingerprint.utils';
import { getHash } from '~/utils/hashes.utils';

import { appService } from '../../app/app.service';
import { contentService } from '../../content/content.service';
import { curseForgeService } from '../../curseforge/curseforge.service';
import { instanceService } from './instance.service';

export const instanceContentService = new (class InstanceContentService {
  private instanceLocks = new Map<string, Mutex>();
  private readonly DELAY_MS = 1000;

  async getContents(payload: InstanceContentQueryDto): Promise<ContentResponseDto> {
    const { id, contentType } = payload;

    const instance = await instanceService.findOne(id);
    const current = instance[contentType] ?? [];

    // For datapacks, we don't need to scan directories, just get from instance and fetch content info
    if (contentType === InstanceContentEnum.DataPacks) {
      const contentIds = current.map((c) => c.id).join(',');
      if (!contentIds) {
        return {
          data: [],
          pagination: { index: 0, pageSize: 0, resultCount: 0, totalCount: 0 },
        };
      }

      return await contentService.findAll({ instance: id, ids: contentIds });
    }

    // For other content types, scan directory and sync with instance.json
    const contentDir = await instanceService.getContentDir(id, contentType);
    const metaMap = new Map(current.map((c) => [c.fileName + ':' + c.fileLength, c]));

    const files = await readdir(contentDir, { withFileTypes: true }).catch(() => []);
    const ext = contentType === InstanceContentEnum.Mods ? '.jar' : '.zip';

    const entries = files.filter((f) => f.isFile() && f.name.endsWith(ext));
    const filePaths = entries.map((j) => path.join(contentDir, j.name));

    const limit = pLimit(8);
    const fingerprintTargets = await Promise.all(
      filePaths.map((filePath) =>
        limit(async () => {
          const { size } = await stat(filePath);
          const key = path.basename(filePath) + ':' + size;
          return metaMap.has(key) ? null : filePath;
        }),
      ),
    ).then((list) => list.filter(Boolean) as string[]);

    if (fingerprintTargets.length > 0) {
      const fingerprinters = await getFingerprints(fingerprintTargets);
      const fingerResponse = await curseForgeService.getFingerprintsMatches(fingerprinters);

      const fpToPath = new Map<string, string>();
      fingerprinters.forEach((fp, i) => {
        fpToPath.set(String(fp), fingerprintTargets[i]);
      });

      for (const match of fingerResponse.exactMatches) {
        const m = match.file;
        const filePath = fpToPath.get(String(m.fileFingerprint));
        if (!filePath) continue;

        const { size } = await stat(filePath);
        const key = m.fileName + ':' + size;

        if (!metaMap.has(key)) {
          metaMap.set(key, {
            id: match.id,
            name: m.displayName,
            fileId: m.id,
            fileName: m.fileName,
            fileUrl: m.downloadUrl || contentService.getDownloadUrl(match.id, m.id),
            fileLength: m.fileLength,
            enabled: true,
            hash: m.hashes[0].value,
          });
        }
      }
    }

    const newList = [...metaMap.values()];

    if (newList.length !== current.length) {
      instance[contentType] = newList;
      instanceService.update(id, instance);
    }

    const contentIds = newList.map((c) => c.id).join(',');
    if (!contentIds) {
      return {
        data: [],
        pagination: { index: 0, pageSize: 0, resultCount: 0, totalCount: 0 },
      };
    }

    return await contentService.findAll({ instance: id, ids: contentIds });
  }

  async addContents(payload: InstanceContentAddQueryDto) {
    const { id: instanceId, contentId, fileId, worlds } = payload;

    const lock = this.instanceLock(instanceId);

    return lock.runExclusive(async () => {
      const instance = await instanceService.findOne(instanceId);
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

      instanceService.update(instanceId, instance);
      return this.downloadContents({ id: instanceId, grouped, worlds });
    });
  }

  async removeContents(payload: InstanceContentRemoveQueryDto): Promise<InstanceContentRemoveResponseDto> {
    const { id: instanceId, contentType, contentIds } = payload;
    const lock = this.instanceLock(instanceId);

    return lock.runExclusive(async () => {
      const instance = await instanceService.findOne(instanceId);

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
      await instanceService.update(instanceId, instance);

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
      const instance = await instanceService.findOne(instanceId);
      const contents = instance[contentType];
      if (!Array.isArray(contents) || !contents.length)
        throw new NotFoundException(`No ${contentType} found in instance`);

      const toggled: InstanceContentDto[] = [];

      for (const content of contents) {
        if (!contentIds.includes(content.id)) continue;

        const currentEnabled = content.enabled;
        const targetEnabled = enable ?? !currentEnabled;
        if (currentEnabled === targetEnabled) continue;

        const contentDir = await instanceService.getContentDir(instanceId, contentType);
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

      await instanceService.update(instanceId, instance);

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
    const zipper = new Zipper();

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

                  await zipper.decompress(file.path, folder);
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
            const datapackDir = await instanceService.getContentDir(instanceId, contentType, world);
            const datapackPath = path.join(datapackDir, content.fileName);
            const datapackPathDisabled = `${datapackPath}.disabled`;

            await Promise.all([rm(datapackPath, { force: true }), rm(datapackPathDisabled, { force: true })]);
            logger(`Removed old ${contentType}: "${content.fileName}" from "${datapackDir}"`);
          }),
        );
      } else {
        const contentDir = await instanceService.getContentDir(instanceId, contentType);
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
          const folder = await instanceService.getContentDir(instanceId, InstanceContentEnum.DataPacks, world);
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
        const folder = await instanceService.getContentDir(instanceId, type as InstanceContentEnum);
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

    try {
      const digest = await getHash(filePath, algorithm);
      return digest.toLowerCase() !== expectedHash.toLowerCase();
    } catch (err) {
      logger(`Failed to calculate hash for ${filePath}:`, err);
      return true;
    }
  }

  private instanceLock(id: string) {
    if (!this.instanceLocks.has(id)) {
      this.instanceLocks.set(id, new Mutex());
    }
    return this.instanceLocks.get(id)!;
  }
})();
