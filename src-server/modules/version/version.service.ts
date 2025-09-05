import { loaderTypeToName } from '@shared/constants/launcher.constant';
import { ReleaseNote, Version } from '@shared/types/version.type';
import axios from 'axios';
import { readdir } from 'fs/promises';
import path from 'path';

import { curseForgeService } from '~s/modules/curseforge/curseforge.service';

import { instanceService } from '../instance/instance.service';
import { launcherService } from '../launcher/launcher.service';

const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

class VersionService {
  private listNote: any[] = [];
  private readonly NOTE_API = 'https://launchercontent.mojang.com/v2/';

  async findAll() {
    const [releases, loaders, instances, downloaded] = await Promise.all([
      this.getReleaseVersions(),
      this.getLoaderTypeByVersions(),
      this.getInstanceVersions(),
      this.getVersionDownloaded(),
    ]);

    const result: Version[] = [];

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

  async getReleaseVersions(): Promise<Version[]> {
    const raw = await curseForgeService.getMinecraftVersions();
    return raw.data
      .filter((v: any) => !v.versionString.toLowerCase().includes('snapshot'))
      .map((v: any) => ({
        name: `Release ${v.versionString}`,
        type: 'release',
        version: v.versionString,
      }));
  }

  async getLoaderVersions(version?: string, type?: string): Promise<Version[]> {
    const raw = await curseForgeService.getLoaderVersions(version);

    const mapped = (raw.data ?? []).map((item: any) => {
      const loaderType = loaderTypeToName[item.type];
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

  async getReleaseNote(pageIndex: number, pageSize: number) {
    if (!this.listNote.length) {
      const listNoteRes = await axios.get(`${this.NOTE_API}javaPatchNotes.json`);
      this.listNote = listNoteRes.data.entries.filter((entry: any) => entry.type === 'release');
    }

    const start = (pageIndex - 1) * pageSize;
    const end = start + pageSize;
    const sliceNotes = this.listNote.slice(start, end);

    const details: ReleaseNote[] = await Promise.all(
      sliceNotes.map(async (note) => {
        const res = await axios.get(`${this.NOTE_API}${note.contentPath}`);
        return res.data;
      }),
    );

    return details.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  private async getLoaderTypeByVersions(version?: string) {
    const raw = await curseForgeService.getLoaderVersions(version);

    const grouped: Record<string, Record<number, any[]>> = {};
    for (const item of raw.data ?? []) {
      if (!grouped[item.gameVersion]) grouped[item.gameVersion] = {};
      if (!grouped[item.gameVersion][item.type]) grouped[item.gameVersion][item.type] = [];
      grouped[item.gameVersion][item.type].push(item);
    }

    const result: Version[] = [];

    for (const [gameVersion, typeGroups] of Object.entries(grouped)) {
      for (const [typeId] of Object.entries(typeGroups)) {
        const loaderType = loaderTypeToName[Number(typeId)];
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

  private async getInstanceVersions(): Promise<Version[]> {
    const instances = await instanceService.findAll();
    return instances.map((inst) => ({
      name: inst.name,
      type: 'modified',
      version: inst.version,
      loader: inst.loader,
      instance: inst.id,
    }));
  }

  private async getVersionDownloaded() {
    try {
      const gameDir = (await launcherService.getConfig()).minecraft.gamedir;
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
