import { ContentDto } from '@shared/dtos/content.dto';
import {
  AddContentInstanceDto,
  FindContentsInstanceDto,
  InstanceDto,
  RemoveContentInstanceDto,
  ToggleContentInstanceDto,
  UpdateInstanceDto,
} from '@shared/dtos/instance.dto';
import { formatToSlug } from '@shared/utils/general.utils';
import { Mutex } from 'async-mutex';
import { existsSync } from 'fs';
import { mkdir, readdir, readFile, rename, rm, stat, unlink, writeFile } from 'fs/promises';
import pLimit from 'p-limit';
import path from 'path';

import { BadRequestException, NotFoundException } from '~s/common/filters/exception.filter';
import { Downloader } from '~s/libraries/minecraft-java-core/build/Index';
import { DownloadOptions } from '~s/libraries/minecraft-java-core/build/utils/Downloader';

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
    const { id: instanceId, type, contentId, worldName, name, author, logoUrl } = payload;

    const lock = getInstanceLock(instanceId);

    return lock.runExclusive(async () => {
      const config = await configService.getConfig();
      const pathDir = await this.getPathByContentType(instanceId, type, worldName);

      const contentsMap = new Map<number, ContentDto>();
      const contentsToDownload: ContentDto[] = [];

      const resolveContent = async (id: number, gameVersion: string, loaderType?: string) => {
        if (contentsMap.has(id)) return contentsMap.get(id)!;

        const contentFile = await curseForgeService.getModFiles(id, gameVersion, loaderType);
        if (!contentFile.data.length) return null;

        const file = contentFile.data[0];
        const fileUrl =
          file.downloadUrl ?? `https://www.curseforge.com/api/v1/mods/${file.modId}/files/${file.id}/download`;

        const content: ContentDto = {
          id: file.modId,
          name,
          author,
          logoUrl,
          fileId: file.id,
          fileName: file.fileName,
          fileUrl,
          fileSize: file.fileLength,
          enabled: true,
          dependencies: [],
        };

        contentsMap.set(content.id, content);
        contentsToDownload.push(content);

        if (file.dependencies?.length) {
          const deps = await Promise.all(
            file.dependencies
              .filter((dep: { relationType: number }) => dep.relationType === 3)
              .map(async (dep: { modId: number }) => {
                const depAdd = await resolveContent(dep.modId, gameVersion, loaderType);
                return depAdd?.id ?? null;
              }),
          );
          content.dependencies = deps.filter((id): id is number => id !== null);
        }

        return content;
      };

      const instance = await this.findOne(instanceId);

      await resolveContent(contentId, instance.version, instance.loader.type);

      const existingContents = instance[type] ?? [];
      const newContents = Array.from(contentsMap.values());

      instance[type] = [...existingContents.filter((a) => !newContents.some((n) => n.id === a.id)), ...newContents];
      await this.update({ id: instanceId, instance });

      return this.handleDownloadContent(contentsToDownload, pathDir, config.download_multiple);
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

  async handleDownloadContent(contents: ContentDto[], pathDir: string, limit = 3) {
    if (!contents.length) throw new Error('No additional to download');

    await mkdir(pathDir, { recursive: true });

    const results = await Promise.all(
      contents.map(async (a) => {
        const filePath = path.join(pathDir, a.fileName);

        let needDownload = true;
        if (existsSync(filePath)) {
          try {
            const fileStat = await stat(filePath);
            if (fileStat.size === a.fileSize) needDownload = false;
          } catch (err) {
            needDownload = true;
          }
        }

        if (needDownload)
          return {
            url: a.fileUrl,
            path: filePath,
            folder: pathDir,
            length: a.fileSize,
            type: 'additional',
          } as DownloadOptions;
        return null;
      }),
    );

    const filesToDownload = results.filter((r): r is DownloadOptions => r !== null);
    if (!filesToDownload.length) return null;

    const downloader = new Downloader();
    const totalSize = filesToDownload.reduce((acc, f) => acc + (f.length ?? 0), 0);

    downloader.downloadFileMultiple(filesToDownload, totalSize, limit);
    return downloader;
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
