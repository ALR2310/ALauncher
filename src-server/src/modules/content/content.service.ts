import {
  ContentFindFilesQueryDto,
  ContentQueryDto,
  ContentResponseDto,
  DetailContentQueryDto,
  DetailContentResponseDto,
} from '@shared/dtos/content.dto';
import { loaderMap } from '@shared/mappings/general.mapping';
import { capitalize, compareVersion, formatBytes } from '@shared/utils/general.utils';
import { CurseForgePagination } from 'curseforge-api/v1/Types';
import pick from 'lodash/pick';

import { NotFoundException } from '~/common/filters/exception.filter';

import { curseForgeService } from '../curseforge/curseforge.service';
import { instanceService } from '../instance/instance.service';

class ContentService {
  async findAll(payload: ContentQueryDto): Promise<ContentResponseDto> {
    const { instance: instanceId, ids, ...rest } = payload;

    let pagination: CurseForgePagination = { index: 0, pageSize: 0, resultCount: 0, totalCount: 0 };

    const contents = ids
      ? await curseForgeService.getMods(ids.split(',').map((id) => parseInt(id, 10)))
      : await curseForgeService.searchMods(rest as any).then((res) => {
          pagination = res.pagination;
          return res.data;
        });

    const instance = instanceId ? await instanceService.findOne(instanceId) : null;

    try {
      const installedContentsMap = new Map<number, { fileId: number; enabled: boolean; fileName: string }>();

      if (instance) {
        const allTypes = ['mods', 'resourcepacks', 'shaderpacks', 'datapacks', 'worlds'] as const;
        for (const t of allTypes) {
          const contents = instance[t];
          if (contents) {
            contents.forEach(({ id, fileId, enabled, fileName }) => {
              installedContentsMap.set(id, { fileId, enabled, fileName });
            });
          }
        }
      }

      const data = contents.map((item) => {
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

        const result: DetailContentResponseDto = {
          screenshots: item.screenshots.map(({ title, thumbnailUrl, url }) => ({ title, thumbnailUrl, url })),
          id: item.id,
          name: item.name,
          slug: item.slug,
          links: { ...item.links },
          summary: item.summary,
          downloadCount: item.downloadCount,
          fileSize: formatBytes(item.latestFiles?.[0]?.fileLength ?? 0),
          categories: item.categories.map(({ id, name, slug, url, iconUrl }) => ({ id, name, slug, url, iconUrl })),
          classId: item.classId,
          authors: item.authors.map(({ id, name, url, avatarUrl }: any) => ({ id, name, url, avatarUrl })),
          logo: { ...pick(item.logo, ['title', 'thumbnailUrl', 'url']) },
          gameVersions: [...new Set<string>((item.latestFilesIndexes ?? []).map((f) => f.gameVersion))].sort(
            compareVersion,
          ),
          loaderTypes: [
            ...new Set<string>(
              (item.latestFilesIndexes ?? [])
                .map((f) => capitalize(loaderMap.idToKey[f.modLoader]))
                .filter((loader) => loader != null),
            ),
          ],
          dateCreated: item.dateCreated,
          dateModified: item.dateModified,
          dateReleased: item.dateReleased,
          latestFilesIndexes: item.latestFilesIndexes,
          instance: { status, enabled, fileName },
        };

        return result;
      });

      return {
        data,
        pagination,
      };
    } catch (e) {
      throw new Error('Failed to parse mod data');
    }
  }

  async findOne(payload: DetailContentQueryDto) {
    const { slug } = payload;

    const modInfo = await curseForgeService.searchMods({ slug }).then((res) => res.data[0]);
    const modDesc = modInfo ? await curseForgeService.getModDescription(modInfo.id) : null;

    if (!modInfo) throw new NotFoundException(`Mod with slug ${slug} not found`);

    const result: DetailContentResponseDto = {
      screenshots: modInfo.screenshots.map(({ title, thumbnailUrl, url }) => ({ title, thumbnailUrl, url })),
      id: modInfo.id,
      name: modInfo.name,
      slug: modInfo.slug,
      links: { ...modInfo.links },
      summary: modInfo.summary,
      downloadCount: modInfo.downloadCount,
      fileSize: formatBytes(modInfo.latestFiles?.[0]?.fileLength ?? 0),
      categories: modInfo.categories.map(({ id, name, slug, url, iconUrl }) => ({ id, name, slug, url, iconUrl })),
      classId: modInfo.classId,
      authors: modInfo.authors.map(({ id, name, url, avatarUrl }: any) => ({ id, name, url, avatarUrl })),
      logo: { ...pick(modInfo.logo, ['title', 'thumbnailUrl', 'url']) },
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
      latestFilesIndexes: modInfo.latestFilesIndexes,
    };

    return result;
  }

  async findFiles(payload: ContentFindFilesQueryDto) {
    return payload;
  }
}

export const contentService = new ContentService();
