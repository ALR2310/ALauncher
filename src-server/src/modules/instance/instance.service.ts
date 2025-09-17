import { ContentDto } from '@shared/dtos/content.dto';
import {
  AddContentInstanceDto,
  FindContentsInstanceDto,
  InstanceDto,
  RemoveContentInstanceDto,
  ToggleContentInstanceDto,
  UpdateInstanceDto,
} from '@shared/dtos/instance.dto';
import { categoryMap } from '@shared/mappings/general.mapping';
import { formatToSlug } from '@shared/utils/general.utils';
import AdmZip from 'adm-zip';
import { Mutex } from 'async-mutex';
import EventEmitter from 'events';
import { existsSync } from 'fs';
import { mkdir, readdir, readFile, rename, rm, stat, unlink, writeFile } from 'fs/promises';
import throttle from 'lodash/throttle';
import pLimit from 'p-limit';
import path from 'path';

import { BadRequestException, NotFoundException } from '~/common/filters/exception.filter';
import { Downloader } from '~/libraries/minecraft-java-core/build/Index';
import { DownloadOptions } from '~/libraries/minecraft-java-core/build/utils/Downloader';

import { configService } from '../config/config.service';
import { contentService } from '../content/content.service';
import { curseForgeService } from '../curseforge/curseforge.service';

const instanceLocks = new Map<string, Mutex>();

function getInstanceLock(instanceId: string) {
  if (!instanceLocks.has(instanceId)) {
    instanceLocks.set(instanceId, new Mutex());
  }
  return instanceLocks.get(instanceId)!;
}

class InstanceService {
  private instanceDir: string | null = null;

  async findAll() {
    await this.ensureInstanceDir();

    const dirs = await readdir(this.instanceDir!, { withFileTypes: true });
    const dirList = dirs.filter((d) => d.isDirectory());

    const limiter = pLimit(5);

    const instances = await Promise.all(
      dirList.map((dir) =>
        limiter(async () => {
          const instancePath = path.join(this.instanceDir!, dir.name, 'instance.json');
          try {
            const data = await readFile(instancePath, 'utf-8');
            return JSON.parse(data) as InstanceDto;
          } catch (err) {
            return null;
          }
        }),
      ),
    );

    const validInstances = instances.filter((i): i is InstanceDto => i !== null);

    return validInstances.sort((a, b) => {
      if (!a.last_updated && !b.last_updated) return 0;
      if (!a.last_updated) return 1;
      if (!b.last_updated) return -1;
      return b.last_updated.localeCompare(a.last_updated);
    });
  }

  async findOne(id: string) {
    if (!id) throw new NotFoundException('Instance ID is required');

    await this.ensureInstanceDir();

    const filePath = path.join(this.instanceDir!, id, 'instance.json');
    try {
      const data = await readFile(filePath, 'utf-8');
      return JSON.parse(data) as InstanceDto;
    } catch (err) {
      throw new BadRequestException(`An error occurred while reading instance ${id}`);
    }
  }

  async create(instance: InstanceDto) {
    await this.ensureInstanceDir();

    if (!instance.id) instance.id = formatToSlug(instance.name);

    const dirPath = path.join(this.instanceDir!, instance.id);
    const filePath = path.join(dirPath, 'instance.json');

    await mkdir(dirPath, { recursive: true });
    await writeFile(filePath, JSON.stringify(instance, null, 2), 'utf-8');
    return instance;
  }

  async update(payload: UpdateInstanceDto) {
    const { id, instance } = payload;
    await this.ensureInstanceDir();

    const existing = await this.findOne(id);

    const updated: InstanceDto = { ...existing, ...instance };
    const filePath = path.join(this.instanceDir!, id, 'instance.json');
    await writeFile(filePath, JSON.stringify(updated, null, 2), 'utf-8');
    return updated;
  }

  async delete(id: string) {
    await this.ensureInstanceDir();

    const existing = await this.findOne(id);

    const dirPath = path.join(this.instanceDir!, id);
    await rm(dirPath, { recursive: true, force: true });
    return existing;
  }

  async findContents(payload: FindContentsInstanceDto) {
    const { id: instanceId, type } = payload;

    const instance = await this.findOne(instanceId);
    const contentIds = instance[type]?.map((c) => c.id) ?? [];

    if (contentIds.length === 0) return { data: [] };

    const response = await contentService.findAll({ instanceId, ids: contentIds.join(',') });
    return response;
  }

  async addContent(payload: AddContentInstanceDto) {
    const { id: instanceId, type: initialType, contentId, worldName } = payload;

    const lock = getInstanceLock(instanceId);

    return lock.runExclusive(async () => {
      const config = await configService.getConfig();
      const instance = await this.findOne(instanceId);

      const groupedContents: Record<string, ContentDto[]> = {};
      const visited = new Map<number, ContentDto>();

      const resolveContent = async (
        id: number,
        gameVersion: string,
        parentType?: string,
      ): Promise<ContentDto | null> => {
        if (visited.has(id)) return visited.get(id)!;

        const contentInfo = await curseForgeService
          .getMods({ modIds: [id] })
          .then((res) => (res.data.length ? res.data[0] : null));

        if (!contentInfo) return null;

        const mappedType = categoryMap.idToText[contentInfo.classId];
        const realType = mappedType ? mappedType.toLowerCase().replace(/\s+/g, '') : (parentType ?? initialType);

        const effectiveLoader = realType === 'mods' ? instance.loader?.type : undefined;

        const contentFile = await curseForgeService
          .getModFiles(id, gameVersion, effectiveLoader)
          .then((res) => (res.data.length ? res.data[0] : null));
        if (!contentFile) return null;

        const fileUrl =
          contentFile.downloadUrl ??
          `https://www.curseforge.com/api/v1/mods/${contentFile.modId}/files/${contentFile.id}/download`;

        const content: ContentDto = {
          id: contentFile.modId,
          name: contentInfo.name,
          fileId: contentFile.id,
          fileName: contentFile.fileName,
          fileUrl,
          fileSize: contentFile.fileLength,
          enabled: true,
          dependencies: [],
        };

        visited.set(content.id, content);

        if (!groupedContents[realType]) groupedContents[realType] = [];
        groupedContents[realType].push(content);

        if (contentFile.dependencies?.length) {
          const deps = await Promise.all(
            contentFile.dependencies
              .filter((dep: { relationType: number }) => dep.relationType === 3)
              .map(async (dep: { modId: number }) => {
                const depContent = await resolveContent(dep.modId, gameVersion, realType);
                return depContent?.id ?? null;
              }),
          );
          content.dependencies = deps.filter((id): id is number => id !== null);
        }

        return content;
      };

      await resolveContent(contentId, instance.version);

      for (const [type, newContents] of Object.entries(groupedContents)) {
        const existing = instance[type] ?? [];
        instance[type] = [
          ...existing.filter((a: ContentDto) => !newContents.some((n) => n.id === a.id)),
          ...newContents,
        ];
      }

      await this.update({ id: instanceId, instance });

      return this.handleDownloadContents(groupedContents, instanceId, config.download_multiple, worldName);
    });
  }

  async removeContent(payload: RemoveContentInstanceDto) {
    const { id: instanceId, type, contentId } = payload;

    const lock = getInstanceLock(instanceId);

    return lock.runExclusive(async () => {
      const [instance, pathDir] = await Promise.all([
        this.findOne(instanceId),
        this.getPathByContentType(instanceId, type),
      ]);

      const content = instance[type]?.find((c) => c.id === contentId);
      if (!content) throw new NotFoundException('Content not found in instance');

      const filePath = path.join(pathDir, content.fileName);
      const disabledPath = filePath + '.disabled';

      try {
        if (existsSync(filePath)) {
          await unlink(filePath);
        } else if (existsSync(disabledPath)) {
          await unlink(disabledPath);
        }
      } catch (err: any) {
        if (err.code !== 'ENOENT') throw err;
      }

      instance[type] = instance[type]?.filter((c) => c.id !== contentId);
      await this.update({ id: instanceId, instance });

      return {
        message: 'Removed successfully',
        data: {
          id: contentId,
          fileName: content.fileName,
        },
      };
    });
  }

  async canRemoveContent(payload: RemoveContentInstanceDto) {
    const { id: instanceId, type, contentId } = payload;

    const lock = getInstanceLock(instanceId);

    return lock.runExclusive(async () => {
      const instance = await this.findOne(instanceId);

      const content = instance.mods!.find((c) => c.id === contentId);
      if (!content) return { canRemove: false, message: `Content ${contentId} not found in instance`, dependents: [] };

      const dependents = (instance[type] ?? [])
        .filter((c) => c.id !== contentId && c.dependencies?.includes(contentId))
        .map((c) => c.name);

      if (dependents.length)
        return {
          canRemove: false,
          message: 'This mod cannot be removed because other mods depend on it',
          dependents,
        };

      return { canRemove: true, message: 'Mod can be removed', dependents: [] };
    });
  }

  async toggleContent(payload: ToggleContentInstanceDto) {
    const { id: instanceId, type, contentIds, enabled } = payload;

    const lock = getInstanceLock(instanceId);

    return lock.runExclusive(async () => {
      const [instance, pathDir] = await Promise.all([
        this.findOne(instanceId),
        this.getPathByContentType(instanceId, type),
      ]);

      const toggleSet = new Set(contentIds);

      const updateContents = await Promise.all(
        (instance[type] ?? []).map(async (content) => {
          if (!toggleSet.has(content.id)) return content;

          const shouldEnable = enabled ?? !content.enabled;

          const filePath = path.resolve(pathDir, content.fileName);
          const disabledPath = filePath + '.disabled';

          try {
            if (shouldEnable && existsSync(disabledPath)) {
              await rename(disabledPath, filePath);
            } else if (!shouldEnable && existsSync(filePath)) {
              await rename(filePath, disabledPath);
            }
          } catch (err) {
            console.error(`Failed to rename mod file ${content.fileName}:`, err);
          }
          return { ...content, enabled: shouldEnable };
        }),
      );

      instance[type] = updateContents;
      await this.update({ id: instanceId, instance });
      return { message: 'Toggled successfully' };
    });
  }

  async handleDownloadContents(
    groupedContents: Record<string, ContentDto[]>,
    instanceId: string,
    limit = 3,
    worldName?: string,
  ) {
    const filesToDownload: DownloadOptions[] = [];

    for (const [type, contents] of Object.entries(groupedContents)) {
      const pathDir = await this.getPathByContentType(instanceId, type, worldName);

      for (const c of contents) {
        const filePath = path.join(pathDir, c.fileName);

        let needDownload = true;
        if (existsSync(filePath)) {
          try {
            const fileStat = await stat(filePath);
            if (fileStat.size === c.fileSize) needDownload = false;
          } catch {
            needDownload = true;
          }
        }

        if (needDownload) {
          filesToDownload.push({
            url: c.fileUrl,
            path: filePath,
            folder: pathDir,
            length: c.fileSize,
            type,
          });
        }
      }
    }

    if (!filesToDownload.length) return null;

    const DELAY = 500;
    const totalSize = filesToDownload.reduce((acc, f) => acc + (f.length ?? 0), 0);
    const event = new EventEmitter();
    const downloader = new Downloader();

    downloader.downloadFileMultiple(filesToDownload, totalSize, limit);

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
        }, DELAY),
      )
      .on(
        'speed',
        throttle((s) => {
          const speedMB = (s / 1024 / 1024).toFixed(2);
          event.emit('speed', `${speedMB}MB/s`);
        }, DELAY),
      )
      .on(
        'estimated',
        throttle((e) => {
          const m = Math.floor(e / 60);
          const s = Math.floor(e % 60);
          event.emit('estimated', `${m}m ${s}s`);
        }, DELAY),
      )
      .on('error', (err) => {
        event.emit('error', err);
      });

    return event;
  }

  async getPathByContentType(instanceId: string, type: string, worldName?: string) {
    await this.ensureInstanceDir();
    const basePath = path.join(this.instanceDir!, instanceId);

    let pathDir: string;

    if (type === 'mods' || type === 'resourcepacks' || type === 'shaderpacks') {
      pathDir = path.join(basePath, type);
    } else if (type === 'datapacks') {
      if (!worldName) throw new BadRequestException('World name is required for datapacks');
      pathDir = path.join(basePath, 'saves', worldName, 'datapacks');
    } else if (type === 'worlds') {
      pathDir = path.join(basePath, 'worlds');
    } else {
      throw new BadRequestException('Invalid additional type');
    }
    return pathDir;
  }

  private async ensureInstanceDir() {
    if (!this.instanceDir) {
      const config = await configService.getConfig();
      this.instanceDir = path.resolve(config.minecraft.gamedir, 'versions');
    }
    await mkdir(this.instanceDir, { recursive: true });
  }
}

export const instanceService = new InstanceService();
