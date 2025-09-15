import { LoaderDto, ReleaseNoteDto, ReleaseNoteQueryDto, VersionDto } from '@shared/dtos/version.dto';
import { loaderMap } from '@shared/mappings/general.mapping';
import { capitalize } from '@shared/utils/general.utils';
import axios from 'axios';
import { readdir } from 'fs/promises';
import path from 'path';

import { configService } from '../config/config.service';
import { curseForgeService } from '../curseforge/curseforge.service';
import { instanceService } from '../instance/instance.service';

class VersionService {
  private listNote: any[] = [];
  private readonly NOTE_API = 'https://launchercontent.mojang.com/v2/';

  async findAll() {
    const [releases, loaders, instances, downloaded] = await Promise.all([
      this.findReleases(),
      this.findLoadersByVersion(),
      this.mapInstancesToVersions(),
      this.findDownloadedVersions(),
    ]);

    const result: VersionDto[] = [];

    for (const release of releases) {
      const relatedInstances = instances.filter((i) => i.version === release.version);
      for (const instance of relatedInstances) {
        result.push({
          ...instance,
          downloaded: instance.instance
            ? downloaded.includes(instance.instance)
            : downloaded.includes(instance.version),
        });
      }

      const relatedLoaders = loaders.filter((l) => l.version === release.version);
      for (const loader of relatedLoaders) {
        result.push({
          ...loader,
          downloaded: downloaded.includes(loader.version),
        });
      }

      result.push({
        ...release,
        downloaded: downloaded.includes(release.version),
      });
    }

    return result;
  }

  async findReleases(): Promise<VersionDto[]> {
    const raw = await curseForgeService.getMinecraftVersions();
    return raw.data
      .filter((v: any) => !v.versionString.toLowerCase().includes('snapshot'))
      .map((v: any) => ({
        name: `Release ${v.versionString}`,
        type: 'release',
        version: v.versionString,
      }));
  }

  async findLoaders(payload: LoaderDto): Promise<VersionDto[]> {
    const { version, type } = payload;
    const raw = await curseForgeService.getLoaderVersions(version);

    const mapped = (raw.data ?? []).map((item: any) => {
      const loaderType = loaderMap.idToKey[item.type];
      if (!loaderType) return null;

      let loaderVersion = item.name.replace(`${loaderType}-`, '');

      if (loaderVersion.endsWith(`-${item.gameVersion}`)) {
        loaderVersion = loaderVersion.replace(`-${item.gameVersion}`, '');
      }

      const displayName = `${capitalize(loaderType)} ${loaderVersion.replace(/-/g, ' ')}`;

      return {
        name: displayName,
        type: 'modified',
        version: item.gameVersion,
        loader: {
          type: loaderType,
          version: loaderVersion,
        },
      };
    });

    return mapped.filter((m) => m && (!type || m.loader?.type === type));
  }

  async findReleaseNotes(payload: ReleaseNoteQueryDto): Promise<ReleaseNoteDto[]> {
    const { pageIndex, pageSize } = payload;
    if (!this.listNote.length) {
      const listNoteRes = await axios.get(`${this.NOTE_API}javaPatchNotes.json`);
      this.listNote = listNoteRes.data.entries.filter((entry: any) => entry.type === 'release');
    }

    const start = (pageIndex - 1) * pageSize;
    const end = start + pageSize;
    const sliceNotes = this.listNote.slice(start, end);

    const details: ReleaseNoteDto[] = await Promise.all(
      sliceNotes.map(async (note) => {
        const res = await axios.get(`${this.NOTE_API}${note.contentPath}`);
        return res.data;
      }),
    );

    return details.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  private async findLoadersByVersion(version?: string) {
    const raw = await curseForgeService.getLoaderVersions(version);

    const grouped: Record<string, Record<number, any[]>> = {};
    for (const item of raw.data ?? []) {
      if (!grouped[item.gameVersion]) grouped[item.gameVersion] = {};
      if (!grouped[item.gameVersion][item.type]) grouped[item.gameVersion][item.type] = [];
      grouped[item.gameVersion][item.type].push(item);
    }

    const result: VersionDto[] = [];

    for (const [gameVersion, typeGroups] of Object.entries(grouped)) {
      for (const [typeId] of Object.entries(typeGroups)) {
        const loaderType = loaderMap.idToKey[Number(typeId)];
        if (!loaderType) continue;

        result.push({
          name: `${capitalize(loaderType)} ${gameVersion}`,
          type: 'modified',
          version: gameVersion,
          loader: {
            type: loaderType,
            version: 'latest',
          },
        });
      }
    }

    return result;
  }

  private async mapInstancesToVersions(): Promise<VersionDto[]> {
    const instances = await instanceService.findAll();
    return instances.map((inst) => ({
      name: inst.name,
      type: 'modified',
      version: inst.version,
      loader: inst.loader,
      instance: inst.id,
    }));
  }

  private async findDownloadedVersions() {
    try {
      const gameDir = (await configService.getConfig()).minecraft.gamedir;
      const versionPath = path.resolve(gameDir, 'versions');
      return (await readdir(versionPath, { withFileTypes: true }))
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => dirent.name);
    } catch (err: any) {
      if (err.code === 'ENOENT') return [];
      throw err;
    }
  }
}

export const versionService = new VersionService();
