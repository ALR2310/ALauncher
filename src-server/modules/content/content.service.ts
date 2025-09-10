import { loaderMap } from '@shared/mappings/general.mapping';
import { ContentQuery, contentQuerySchema, ContentResponse } from '@shared/schemas/additional.schema';
import { formatBytes } from '@shared/utils/general.utils';

import { Validate } from '~s/common/decorators/validate.decorator';

import { curseForgeService } from '../curseforge/curseforge.service';
import { instanceService } from '../instance/instance.service';

class ContentService {
  @Validate(contentQuerySchema)
  async findAll(payload: ContentQuery) {
    const { instanceId, ...rest } = payload;
    const response = await curseForgeService.searchMods({ ...rest, gameId: 432 });
    const instance = instanceId ? await instanceService.findOne(instanceId) : null;

    try {
      const installedContentsMap = new Map<number, number>();
      if (instance) {
        const allTypes = ['mods', 'resourcepacks', 'shaderpacks', 'datapacks', 'worlds'] as const;
        for (const t of allTypes) {
          const contents = instance[t];
          if (contents) {
            contents.forEach((c) => {
              installedContentsMap.set(c.id, c.fileId);
            });
          }
        }
      }

      return {
        data: response.data.map((item: any) => {
          let status: 'not_installed' | 'outdated' | 'latest' = 'not_installed';

          if (instance && instance.mods) {
            const loaderType = instance.loader.type;
            const gameVersion = instance.version;

            const latestMatch = (item.latestFilesIndexes ?? []).find(
              (f: any) => f.gameVersion === gameVersion && f.modLoader === loaderMap.keyToId[loaderType],
            );

            const installedFileId = installedContentsMap.get(item.id);

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
            downloadCount: item.downloadCount,
            fileSize: formatBytes(item.latestFiles?.[0]?.fileLength ?? 0),
            authors: item.authors,
            logoUrl: item.logo?.url,
            categories: item.categories.map((cat: any) => ({
              id: cat.id,
              name: cat.name,
              slug: cat.slug,
              url: cat?.url,
            })),
            status,
            dateCreated: item.dateCreated,
            dateModified: item.dateModified,
            dateReleased: item.dateReleased,
            latestFilesIndexes: item.latestFilesIndexes,
          };
        }),
        pagination: response.pagination,
      } as ContentResponse;
    } catch (e) {
      throw new Error('Failed to parse mod data');
    }
  }
}

export const contentService = new ContentService();
