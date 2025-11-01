import {
  LoaderQueryDto,
  ReleaseNoteDetailQueryDto,
  ReleaseNoteDetailsDto,
  ReleaseNoteDto,
  ReleaseNoteQueryDto,
  ReleaseNoteResponseDto,
  VERSION_TYPE,
  VersionDto,
} from '@shared/dtos/version.dto';
import { capitalize } from '@shared/utils/general.utils';
import axios from 'axios';
import { CurseForgeModLoaderType } from 'curseforge-api';

import { NotFoundException } from '~/common/filters/exception.filter';

import { curseForgeService } from '../curseforge/curseforge.service';

export const versionService = new (class VersionService {
  private NOTE_API_URL = 'https://launchercontent.mojang.com/v2/';
  private noteCache: ReleaseNoteDto[] = [];

  async findReleases(): Promise<VersionDto[]> {
    const versions = await curseForgeService.getMinecraftVersions();
    return versions
      .filter((v) => !v.versionString.includes('snapshot'))
      .map((v) => ({
        name: `Release ${v.versionString}`,
        type: VERSION_TYPE.RELEASE,
        version: v.versionString,
      }));
  }

  async findLoaders(payload: LoaderQueryDto): Promise<VersionDto[]> {
    const { version, type } = payload;

    const loaders = await curseForgeService.getMinecraftModLoaders({ version, includeAll: true });

    return loaders
      .filter((l) => !type || l.type === type)
      .map((loader) => {
        const enumType = CurseForgeModLoaderType[loader.type];
        if (!enumType) return null;

        const lowerType = enumType.toLowerCase();
        const lowerGame = loader.gameVersion.toLowerCase();

        let loaderVersion = loader.name.toLowerCase();
        loaderVersion = loaderVersion.replace(`${lowerType}-`, '');
        loaderVersion = loaderVersion.replace(`-${lowerGame}`, '');

        return {
          name: `${capitalize(enumType)} ${loaderVersion.replace(/-/g, ' ')}`,
          type: VERSION_TYPE.MODIFIED,
          version: loader.gameVersion,
          loader: {
            type: lowerType,
            version: loaderVersion,
          },
        } as VersionDto;
      })
      .filter((x): x is VersionDto => x !== null);
  }

  async findNotes(payload: ReleaseNoteQueryDto): Promise<ReleaseNoteResponseDto> {
    const { index = 0, pageSize = 50 } = payload;

    if (!this.noteCache.length) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        const { data } = await axios.get(`${this.NOTE_API_URL}javaPatchNotes.json`, {
          signal: controller.signal,
        });

        clearTimeout(timeout);

        this.noteCache = data.entries.map((note: any) => ({
          ...note,
          image: {
            ...note.image,
            url: `${this.NOTE_API_URL.replace('/v2/', '')}${note.image.url}`,
          },
        }));
      } catch {
        this.noteCache = [];
      }
    }

    const start = index;
    const end = Math.min(index + pageSize, this.noteCache.length);
    const sliced = this.noteCache.slice(start, end);

    return {
      data: sliced,
      pagination: {
        index,
        pageSize,
        resultCount: sliced.length,
        totalCount: this.noteCache.length,
      },
    };
  }

  async findNoteDetails(payload: ReleaseNoteDetailQueryDto) {
    const { version } = payload;

    if (!this.noteCache.length) await this.findNotes({});
    const note = this.noteCache.find((note) => note.version === version);

    if (!note) throw new NotFoundException('Release note not found');
    const contentPath = note.contentPath;

    const { data } = await axios.get(`${this.NOTE_API_URL}${contentPath}`);
    const result: ReleaseNoteDetailsDto = { ...note, content: data.body };
    return result;
  }
})();
