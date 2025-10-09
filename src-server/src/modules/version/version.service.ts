import {
  LoaderQueryDto,
  ReleaseNoteDetailQueryDto,
  ReleaseNoteDetailsDto,
  ReleaseNoteDto,
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

  async findLoaders(payload: LoaderQueryDto) {
    const { version, type } = payload;

    const loaders = await curseForgeService.getMinecraftModLoaders({ version, includeAll: true });

    const mapped = loaders.flatMap((loader) => {
      const loaderType = CurseForgeModLoaderType[loader.type];
      if (!loaderType) return [];

      const lowerType = loaderType.toLowerCase();
      let loaderVersion = loader.name.toLowerCase().replace(`${lowerType}-`, '');

      if (loaderVersion.endsWith(`-${loader.gameVersion.toLowerCase()}`)) {
        loaderVersion = loaderVersion.replace(`-${loader.gameVersion.toLowerCase()}`, '');
      }

      const displayName = `${capitalize(loaderType)} ${loaderVersion.replace(/-/g, ' ')}`;

      return [
        {
          name: displayName,
          type: VERSION_TYPE.MODIFIED,
          version: loader.gameVersion,
          loader: { type: lowerType, version: loaderVersion },
        },
      ];
    });

    return mapped.filter((m) => m && (!type || m.loader?.type === type));
  }

  async findNotes(): Promise<ReleaseNoteDto[]> {
    const response = await axios.get(`${this.NOTE_API_URL}javaPatchNotes.json`);
    if (!this.noteCache.length) this.noteCache = response.data.entries;
    return this.noteCache;
  }

  async findNoteDetails(payload: ReleaseNoteDetailQueryDto) {
    const { version } = payload;
    if (!this.noteCache.length) await this.findNotes();
    const note = this.noteCache.find((note) => note.version === version);

    if (!note) throw new NotFoundException('Release note not found');
    const contentPath = note.contentPath;

    const response = await axios.get(`${this.NOTE_API_URL}${contentPath}`);
    const result: ReleaseNoteDetailsDto = { ...note, content: response.data.body };
    return result;
  }
})();
