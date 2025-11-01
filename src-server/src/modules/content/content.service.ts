import { MOD_LOADER } from '@shared/constants/curseforge.const';
import {
  ContentDetailQueryDto,
  ContentDto,
  ContentFileDto,
  ContentFileQueryDto,
  ContentFilesQueryDto,
  ContentFilesResponseDto,
  ContentInstanceStatus,
  ContentQueryDto,
  ContentResponseDto,
} from '@shared/dtos/content.dto';
import { InstanceContentDto } from '@shared/dtos/instance.dto';
import { InstanceContentEnum } from '@shared/enums/general.enum';
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

function splitGameVersions(item: { gameVersions?: string[] }) {
  const MOD_LOADER_NAMES = Object.keys(MOD_LOADER);

  const all = item.gameVersions ?? [];

  const gameVersions: string[] = [];
  const modLoaders: string[] = [];

  for (const v of all) {
    if (MOD_LOADER_NAMES.includes(v)) modLoaders.push(v);
    else gameVersions.push(v);
  }

  return { gameVersions, modLoaders };
}

export const contentService = new (class ContentService {
  async findAll(payload: ContentQueryDto): Promise<ContentResponseDto> {
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
        const types = Object.values(InstanceContentEnum);
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
        let status: ContentInstanceStatus = ContentInstanceStatus.NOT_INSTALLED;
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
                ? ContentInstanceStatus.INSTALLED
                : ContentInstanceStatus.OUTDATED;
          } else if (installContent?.fileId && !latestMatch) {
            status = ContentInstanceStatus.INCOMPATIBLE;
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
          gameVersions: [...new Set<string>((item.latestFilesIndexes ?? []).map((f) => f.gameVersion))].sort(
            compareVersion,
          ),
          modLoaders: [
            ...new Set<string>(
              (item.latestFilesIndexes ?? [])
                .map((f) => capitalize(CurseForgeModLoaderType[f.modLoader]))
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

      return { data, pagination };
    } catch (err) {
      throw new BadRequestException('Failed to get contents');
    }
  }

  async findOne(payload: ContentDetailQueryDto): Promise<ContentDto> {
    const { slug } = payload;
    const content = await this.findAll({ slug }).then((res) => res.data[0]);

    if (!content) {
      throw new BadRequestException('Content not found');
    }

    const description = await curseForgeService.getModDescription(content.id);

    const result: ContentDto = { ...content, description };

    return result;
  }

  async findFile(payload: ContentFileQueryDto): Promise<ContentFileDto> {
    const { id, fileId } = payload;
    const response = await curseForgeService.getModFile(id, fileId);

    const downloadUrl = this.getDownloadUrl(response.modId, response.id);

    const { gameVersions, modLoaders } = splitGameVersions(response);

    const file: ContentFileDto = {
      id: response.id,
      contentId: response.modId,
      releaseType: CurseForgeFileReleaseType[response.releaseType],
      fileName: response.fileName,
      fileStatus: CurseForgeFileStatus[response.fileStatus],
      fileDate: response.fileDate,
      fileLength: response.fileLength,
      fileSize: formatBytes(response.fileLength),
      downloadCount: response.downloadCount,
      downloadUrl,
      gameVersions: [...gameVersions].sort(compareVersion),
      modLoaders,
      hash: response.hashes[0].value,
      dependencies: response.dependencies,
    };

    return file;
  }

  async findFiles(payload: ContentFilesQueryDto): Promise<ContentFilesResponseDto> {
    const { id, ...rest } = payload;

    let pagination: CurseForgePagination = { index: 0, pageSize: 0, resultCount: 0, totalCount: 0 };

    const result = await curseForgeService.getModFiles(id, { ...rest }).then((res) => {
      pagination = res.pagination;
      return res.data;
    });

    const files = result.map((item) => {
      const downloadUrl = item.downloadUrl ?? this.getDownloadUrl(item.modId, item.id);

      const { gameVersions, modLoaders } = splitGameVersions(item);

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
        gameVersions: [...gameVersions].sort(compareVersion),
        modLoaders,
        hash: item.hashes[0].value,
        dependencies: item.dependencies,
      };
      return file;
    });

    return { data: files, pagination };
  }

  private getDownloadUrl(id: number, fileId: number): string {
    return `https://www.curseforge.com/api/v1/mods/${id}/files/${fileId}/download`;
  }
})();
