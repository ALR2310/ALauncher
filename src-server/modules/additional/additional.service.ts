import {
  AdditionalQuery,
  AdditionalResponse,
  DownloadAdditionalPayload,
  downloadAdditionalSchema,
} from '@shared/schema/additional.schema';
import { Additional } from '@shared/schema/instance.schema';
import { formatBytes } from '@shared/utils/general.utils';
import { existsSync } from 'fs';
import { mkdir, stat } from 'fs/promises';
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
    const { modId, instanceId, type = 'mods' } = payload;

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
      await resolveMod(modId, instance.version, instance.loader.type);
      instance.mods = Array.from(modMap.values());
      await instanceService.update(instanceId, instance);
    } else {
      pathDir = path.join(config.minecraft.gamedir, type);
      await resolveMod(modId, config.profile_selected.version, config.profile_selected.loader?.type ?? 'forge');
    }

    return this.handleDownload(modsToDownload, pathDir, config.download_multiple);
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
