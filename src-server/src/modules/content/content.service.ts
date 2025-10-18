import {
  ContentDetailQueryDto,
  ContentDto,
  ContentFileDto,
  ContentFileQueryDto,
  ContentQueryDto,
} from '@shared/dtos/content.dto';
import { INSTANCE_CONTENT_STATUS, INSTANCE_CONTENT_TYPE, InstanceContentDto } from '@shared/dtos/instance.dto';
import { capitalize, compareVersion, formatBytes } from '@shared/utils/general.utils';
import {
  CurseForgeFileReleaseType,
  CurseForgeFileStatus,
  CurseForgeModLoaderType,
  CurseForgePagination,
} from 'curseforge-api/v1/Types';
import pick from 'lodash/pick';

import { BadRequestException } from '~/common/filters/exception.filter';

import { curseForgeService } from '../curseforge/curseforge.service';
import { instanceService } from '../instance/instance.service';

export const contentService = new (class ContentService {
  async findAll(payload: ContentQueryDto) {
    const { instance: instanceId, ids, ...rest } = payload;

    let pagination: CurseForgePagination = { index: 0, pageSize: 0, resultCount: 0, totalCount: 0 };

    const contents = ids
      ? await curseForgeService.getMods(ids.split(',').map((id) => Number(id)))
      : await curseForgeService.searchMods(rest).then((res) => {
          pagination = res.pagination;
          return res.data;
        });

    const instance = instanceId ? await instanceService.findOne(instanceId) : null;

    try {
      const installedContentsMap = new Map<number, InstanceContentDto>();

      if (instance) {
        const types = Object.values(INSTANCE_CONTENT_TYPE);
        for (const t of types) {
          const contents = instance[t];
          if (contents) {
            contents.forEach((c) => {
              installedContentsMap.set(c.id, c);
            });
          }
        }
      }

      const data = contents.map((item) => {
        let status: INSTANCE_CONTENT_STATUS = INSTANCE_CONTENT_STATUS.NOT_INSTALLED;
        let enabled = false;
        let fileName: string | null = null;

        if (instance && instance.loader) {
          const loaderType = instance.loader.type;
          const gameVersion = instance.version;

          const latestMatch = item.latestFilesIndexes.find(
            (f) => f.gameVersion === gameVersion && f.modLoader === loaderType,
          );
          const installContent = installedContentsMap.get(item.id);

          fileName = installContent?.fileName ?? null;
          enabled = installContent?.enabled ?? false;

          if (installContent?.fileId && latestMatch) {
            status =
              installContent.fileId === latestMatch.fileId
                ? INSTANCE_CONTENT_STATUS.INSTALLED
                : INSTANCE_CONTENT_STATUS.OUTDATED;
          } else if (installContent?.fileId && !latestMatch) {
            status = INSTANCE_CONTENT_STATUS.INCOMPATIBLE;
          }
        }

        const result: ContentDto = {
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
          gameVersions: [
            ...new Set<string>(
              (item.latestFilesIndexes ?? [])
                .map((f) => capitalize(CurseForgeModLoaderType[f.modLoader]))
                .filter((loader) => loader != null),
            ),
            ...new Set<string>((item.latestFilesIndexes ?? []).map((f) => f.gameVersion)),
          ].sort(compareVersion),
          dateCreated: item.dateCreated,
          dateModified: item.dateModified,
          dateReleased: item.dateReleased,
          latestFilesIndexes: item.latestFilesIndexes,
          instance: { status, enabled, fileName },
        };

        return result;
      });

      return { data, pagination };
    } catch (err) {
      throw new BadRequestException('Failed to get contents');
    }
  }

  async findOne(payload: ContentDetailQueryDto) {
    const { slug } = payload;
    const content = await this.findAll({ slug }).then((res) => res.data[0]);

    if (!content) {
      throw new BadRequestException('Content not found');
    }

    const description = await curseForgeService.getModDescription(content.id);

    const result: ContentDto = { ...content, description };

    return result;
  }

  async findFiles(payload: ContentFileQueryDto) {
    const { id, ...rest } = payload;

    let pagination: CurseForgePagination = { index: 0, pageSize: 0, resultCount: 0, totalCount: 0 };

    const result = await curseForgeService.getModFiles(id, { ...rest }).then((res) => {
      pagination = res.pagination;
      return res.data;
    });

    const files = result.map((item) => {
      const downloadUrl =
        item.downloadUrl ?? `https://www.curseforge.com/api/v1/mods/${item.modId}/files/${item.id}/download`;

      const file: ContentFileDto = {
        id: item.id,
        contentId: item.modId,
        releaseType: CurseForgeFileReleaseType[item.releaseType],
        fileName: item.fileName,
        fileStatus: CurseForgeFileStatus[item.fileStatus],
        fileDate: item.fileDate,
        fileLength: item.fileLength,
        fileSize: formatBytes(item.fileLength),
        downloadCount: item.downloadCount,
        downloadUrl,
        gameVersions: item.gameVersions,
        dependencies: item.dependencies,
      };
      return file;
    });

    return { data: files, pagination };
  }
})();
