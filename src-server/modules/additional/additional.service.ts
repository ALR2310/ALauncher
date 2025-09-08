import {
  AdditionalQuery,
  AdditionalResponse,
  CanRemoveAdditionalPayload,
  CanRemoveAdditionalResponse,
  canRemoveAdditionalSchema,
  DownloadAdditionalPayload,
  downloadAdditionalSchema,
  RemoveAdditionalPayload,
  RemoveAdditionalResponse,
  removeAdditionalSchema,
  ToggleAdditionalPayload,
  toggleAdditionalSchema,
} from '@shared/schema/additional.schema';
import { Additional } from '@shared/schema/instance.schema';
import { formatBytes } from '@shared/utils/general.utils';
import { existsSync } from 'fs';
import { mkdir, rename, stat, unlink } from 'fs/promises';
import path from 'path';

import { Validate } from '~s/common/decorators/validate.decorator';
import { Downloader } from '~s/libraries/minecraft-java-core/build/Index';
import { DownloadOptions } from '~s/libraries/minecraft-java-core/build/utils/Downloader';

import { curseForgeService } from '../curseforge/curseforge.service';
import { instanceService } from '../instance/instance.service';
import { launcherService } from '../launcher/launcher.service';

class AdditionalService {
  async searchMods(params: AdditionalQuery) {
    const {
      classId,
      categoryIds,
      gameVersion,
      searchFilter,
      sortField,
      modLoaderType,
      slug,
      index = 0,
      pageSize = 50,
    } = params;

    const response = await curseForgeService.searchMods({
      gameId: 432,
      classId,
      categoryIds,
      gameVersion,
      searchFilter,
      sortField,
      modLoaderType,
      slug,
      index: index * pageSize,
      pageSize,
      sortOrder: 'desc',
    });

    return {
      data: response.data.map((item: any) => ({
        id: item.id,
        name: item.name,
        slug: item.slug,
        link: item.links.websiteUrl,
        summary: item.summary,
        downloadCount: item.downloadCount,
        fileSize: formatBytes(item.latestFiles[0].fileLength),
        authors: item.authors,
        logoUrl: item.logo.url,
        categories: item.categories.map((cat: any) => ({
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          url: cat.url,
        })),
        dateCreated: item.dateCreated,
        dateModified: item.dateModified,
        dateReleased: item.dateReleased,
      })),
      pagination: response.pagination,
    } as AdditionalResponse;
  }

  @Validate(downloadAdditionalSchema)
  async downloadAdditional(payload: DownloadAdditionalPayload) {
    const { id, instanceId, type = 'mods' } = payload;

    const config = await launcherService.getConfig();
    let pathDir: string;

    const modMap = new Map<number, Additional>();
    const modsToDownload: Additional[] = [];

    const resolveMod = async (modId: number, gameVersion: string, loaderType: string): Promise<Additional | null> => {
      if (modMap.has(modId)) return modMap.get(modId)!;

      const modFiles = await curseForgeService.getModFiles(modId, gameVersion, loaderType);
      if (!modFiles.data.length) return null;

      const file = modFiles.data[0];

      const newMod: Additional = {
        id: file.modId,
        name: file.displayName,
        fileName: file.fileName,
        fileUrl: file.downloadUrl,
        fileSize: file.fileLength,
        enabled: true,
        dependencies: [],
      };

      modMap.set(newMod.id, newMod);
      modsToDownload.push(newMod);

      if (file.dependencies?.length) {
        const deps = await Promise.all(
          file.dependencies
            .filter((dep: { relationType: number }) => dep.relationType === 3)
            .map(async (dep: { modId: number }) => {
              const depMod = await resolveMod(dep.modId, gameVersion, loaderType);
              return depMod?.id ?? null;
            }),
        );
        newMod.dependencies = deps.filter((id): id is number => id !== null);
      }

      return newMod;
    };

    if (instanceId) {
      const instance = await instanceService.findOne(instanceId);
      if (!instance) throw new Error('Instance not found');
      pathDir = path.join(config.minecraft.gamedir, 'versions', instance.id!, type);
      await resolveMod(id, instance.version, instance.loader.type);
      instance.mods = Array.from(modMap.values());
      await instanceService.update(instanceId, instance);
    } else {
      pathDir = path.join(config.minecraft.gamedir, type);
      await resolveMod(id, config.profile_selected.version, config.profile_selected.loader?.type ?? 'forge');
    }

    return this.handleDownload(modsToDownload, pathDir, config.download_multiple);
  }

  @Validate(removeAdditionalSchema)
  async removeAdditional(payload: RemoveAdditionalPayload): Promise<RemoveAdditionalResponse> {
    const { id, instanceId, type = 'mods' } = payload;

    if (!instanceId) throw new Error('InstanceId is required');

    const [instance, config] = await Promise.all([instanceService.findOne(instanceId), launcherService.getConfig()]);
    if (!instance) throw new Error('Instance not found');

    const targetMod = instance[type]?.find((a) => a.id === id);
    if (!targetMod) throw new Error('Mod not found in instance');

    const pathDir = path.join(config.minecraft.gamedir, 'versions', instance.id!, type);

    const filePath = path.resolve(pathDir, targetMod.fileName);
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

    instance[type] = instance[type]?.filter((a: any) => a.id !== id);
    await instanceService.update(instanceId, instance);

    return {
      success: true,
      message: 'Removed successfully',
      data: {
        id: id,
        fileName: targetMod.fileName,
      },
    };
  }

  @Validate(canRemoveAdditionalSchema)
  async canRemoveAdditional(payload: CanRemoveAdditionalPayload): Promise<CanRemoveAdditionalResponse> {
    const { id, instanceId } = payload;
    if (!instanceId) return { canRemove: false, message: 'Method not implemented' };

    const instance = await instanceService.findOne(instanceId);
    if (!instance) throw new Error('Instance not found');
    if (!instance.mods) return { canRemove: false, message: 'Instance has no mods' };

    const targetMod = instance.mods.find((m) => m.id === id);
    if (!targetMod) {
      return { canRemove: false, message: `Mod ${id} not found` };
    }

    const dependents = instance.mods.filter((m) => m.id !== id && m.dependencies?.includes(id)).map((m) => m.name);

    if (dependents.length)
      return {
        canRemove: false,
        message: 'This mod cannot be removed because other mods depend on it',
        dependents,
      };

    return { canRemove: true, message: 'Mod can be removed' };
  }

  @Validate(toggleAdditionalSchema)
  async toggleAdditional(payload: ToggleAdditionalPayload): Promise<{ message: string }> {
    const { ids, instanceId, enabled } = payload;

    if (!instanceId) return { message: 'Method not implemented' };

    const [instance, config] = await Promise.all([instanceService.findOne(instanceId), launcherService.getConfig()]);
    if (!instance) throw new Error('Instance not found');

    const pathDir = path.join(config.minecraft.gamedir, 'versions', instance.id!, 'mods');

    const toggleSet = new Set(ids);

    const updatedMods = await Promise.all(
      (instance.mods ?? []).map(async (mod) => {
        if (!toggleSet.has(mod.id)) return mod;

        const shouldEnable = enabled ?? !mod.enabled;

        const filePath = path.resolve(pathDir, mod.fileName);
        const disabledPath = filePath + '.disabled';

        try {
          if (shouldEnable && existsSync(disabledPath)) {
            await rename(disabledPath, filePath);
          } else if (!shouldEnable && existsSync(filePath)) {
            await rename(filePath, disabledPath);
          }
        } catch (err) {
          console.error(`Failed to rename mod file ${mod.fileName}:`, err);
        }

        return { ...mod, enabled: shouldEnable };
      }),
    );

    instance.mods = updatedMods;
    await instanceService.update(instanceId, instance);

    return { message: 'Toggled successfully' };
  }

  private async handleDownload(additional: Additional[], pathDir: string, limit = 3) {
    if (!additional.length) throw new Error('No mods to download');

    await mkdir(pathDir, { recursive: true });

    const results = await Promise.all(
      additional.map(async (a) => {
        const filePath = path.resolve(pathDir, a.fileName);

        let needDownload = true;
        if (existsSync(filePath)) {
          try {
            const fileStat = await stat(filePath);
            if (fileStat.size === a.fileSize) {
              needDownload = false;
            }
          } catch {
            needDownload = true;
          }
        }

        if (needDownload) {
          return {
            url: a.fileUrl,
            path: filePath,
            folder: pathDir,
            length: a.fileSize,
            type: 'additional',
          } as DownloadOptions;
        }
        return null;
      }),
    );

    const filesToDownload = results.filter((f): f is DownloadOptions => f !== null);
    if (filesToDownload.length === 0) {
      return null;
    }

    const downloader = new Downloader();
    const totalSize = filesToDownload.reduce((acc, f) => acc + (f.length ?? 0), 0);

    downloader.downloadFileMultiple(filesToDownload, totalSize, limit);

    return downloader;
  }
}

export const additionalService = new AdditionalService();
