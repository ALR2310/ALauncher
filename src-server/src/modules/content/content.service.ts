import {
  ContentQueryDto,
  ContentResponseDto,
  DetailContentQueryDto,
  DetailContentResponseDto,
} from '@shared/dtos/content.dto';
import { loaderMap } from '@shared/mappings/general.mapping';
import { capitalize, compareVersion, formatBytes } from '@shared/utils/general.utils';

import { NotFoundException } from '~/common/filters/exception.filter';

import { curseForgeService } from '../curseforge/curseforge.service';
import { instanceService } from '../instance/instance.service';

class ContentService {
  async findAll(payload: ContentQueryDto) {
    const { instanceId, ids, ...rest } = payload;
    const response = ids
      ? await curseForgeService.getMods({ modIds: ids.split(',').map((id) => parseInt(id, 10)) })
      : await curseForgeService.searchMods({ ...rest, gameId: 432 });
    const instance = instanceId ? await instanceService.findOne(instanceId) : null;

    try {
      const installedContentsMap = new Map<number, { fileId: number; enabled: boolean; fileName: string }>();

      if (instance) {
        const allTypes = ['mods', 'resourcepacks', 'shaderpacks', 'datapacks', 'worlds'] as const;
        for (const t of allTypes) {
          const contents = instance[t];
          if (contents) {
            contents.forEach((c) => {
              installedContentsMap.set(c.id, { fileId: c.fileId, enabled: c.enabled, fileName: c.fileName });
            });
          }
        }
      }

      return {
        data: response.data.map((item: any) => {
          let status: 'not_installed' | 'outdated' | 'latest' = 'not_installed';
          let enabled = false;
          let fileName: string | null = null;

          if (instance) {
            const loaderType = instance.loader.type;
            const gameVersion = instance.version;

            const latestMatch = (item.latestFilesIndexes ?? []).find(
              (f: any) => f.gameVersion === gameVersion && f.modLoader === loaderMap.keyToId[loaderType],
            );

            const installedFileId = installedContentsMap.get(item.id)?.fileId;
            const installedContent = installedContentsMap.get(item.id);
            fileName = installedContent?.fileName ?? null;
            enabled = installedContent?.enabled ?? false;

            if (installedFileId && latestMatch) {
              if (installedFileId === latestMatch.fileId) status = 'latest';
              else status = 'outdated';
            } else if (installedFileId) {
              status = 'outdated';
            }
          }

          return {
            id: item.id,
            name: item.name,
            slug: item.slug,
            link: item.links.websiteUrl,
            summary: item.summary,
            status,
            enabled,
            downloadCount: item.downloadCount,
            fileSize: formatBytes(item.latestFiles?.[0]?.fileLength ?? 0),
            fileName,
            authors: item.authors,
            logoUrl: item.logo?.url,
            dateCreated: item.dateCreated,
            dateModified: item.dateModified,
            dateReleased: item.dateReleased,
            categories: item.categories.map((cat: any) => ({
              id: cat.id,
              name: cat.name,
              slug: cat.slug,
              url: cat?.url,
            })),
            latestFilesIndexes: item.latestFilesIndexes,
          };
        }),
        pagination: response.pagination,
      } as ContentResponseDto;
    } catch (e) {
      throw new Error('Failed to parse mod data');
    }
  }

  async findOne(payload: DetailContentQueryDto) {
    const { slug } = payload;

    const modInfo = await curseForgeService.searchMods({ slug }).then((res) => res.data[0]);
    const modDesc = modInfo ? await curseForgeService.getModDescription(modInfo.id).then((res) => res.data) : null;

    if (!modInfo) throw new NotFoundException(`Mod with slug ${slug} not found`);

    modInfo.description = modDesc;

    const result: DetailContentResponseDto = {
      screenshots: modInfo.screenshots.map((s: any) => ({
        title: s.title,
        thumbnailUrl: s.thumbnailUrl,
        url: s.url,
      })),
      id: modInfo.id,
      name: modInfo.name,
      slug: modInfo.slug,
      links: modInfo.links,
      summary: modInfo.summary,
      downloadCount: modInfo.downloadCount,
      categories: modInfo.categories.map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        url: cat.url,
        iconUrl: cat.iconUrl,
      })),
      classId: modInfo.classId,
      authors: modInfo.authors.map((author: any) => ({
        id: author.id,
        name: author.name,
        url: author.url,
        avatarUrl: author.avatarUrl,
      })),
      logo: {
        title: modInfo.logo.title,
        thumbnailUrl: modInfo.logo.thumbnailUrl,
        url: modInfo.logo.url,
      },
      gameVersions: [...new Set<string>((modInfo.latestFilesIndexes ?? []).map((f: any) => f.gameVersion))].sort(
        compareVersion,
      ),
      loaderTypes: [
        ...new Set<string>(
          (modInfo.latestFilesIndexes ?? [])
            .map((f: any) => capitalize(loaderMap.idToKey[f.modLoader]))
            .filter((loader: any) => loader != null),
        ),
      ],
      dateCreated: modInfo.dateCreated,
      dateModified: modInfo.dateModified,
      dateReleased: modInfo.dateReleased,
      description: modDesc,
    };

    return result;
  }
}

export const contentService = new ContentService();
