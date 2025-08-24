import { InstanceType } from '@shared/launcher.type';
import { readdir, readFile } from 'fs/promises';
import { Hono } from 'hono';
import path from 'path';

import { curseForgeService } from '~s/services/curseforgeService';
import { launcherService } from '~s/services/launcherService';

const versionController = new Hono();

async function getVersionDownloaded(): Promise<string[]> {
  try {
    const pathDir = (await launcherService.getConfig()).minecraft.gamedir;
    const fullPath = path.resolve(pathDir, 'versions');
    return (await readdir(fullPath, { withFileTypes: true }))
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);
  } catch (err: any) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

async function getInstanceDownloaded(): Promise<InstanceType[]> {
  try {
    const pathDir = path.resolve('instances');
    const files = await readdir(pathDir);
    const instances = await Promise.all(
      files.map(async (file) => {
        const fullPath = path.resolve(pathDir, file);
        return readFile(fullPath, 'utf-8')
          .then((data) => JSON.parse(data))
          .catch(() => null);
      }),
    );
    return instances.filter((i): i is InstanceType => i !== null);
  } catch (err: any) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

export default versionController
  .get('/', async (c) => {
    const [versions, versionDownloaded, instances] = await Promise.all([
      curseForgeService.getMinecraftVersion(),
      getVersionDownloaded(),
      getInstanceDownloaded(),
    ]);

    const groupedInstances = (instances as InstanceType[]).reduce<Record<string, any[]>>((acc, ins) => {
      const obj = {
        name: ins.name,
        version: ins.slug,
        type: 'modified',
        downloaded: false,
        minecraft: ins.minecraft,
      };
      (acc[ins.minecraft] ??= []).push(obj);
      return acc;
    }, {});

    const merged = versions
      .filter((v) => !v.versionString.toLowerCase().includes('snapshot'))
      .flatMap((v) => [
        ...(groupedInstances[v.versionString] ?? []),
        {
          name: `Release ${v.versionString}`,
          version: v.versionString,
          type: 'release',
          downloaded: versionDownloaded.includes(v.versionString),
        },
      ]);

    return c.json(merged);
  })
  .get('/loader/:version', async (c) => {
    const { version } = c.req.param();

    const LoaderTypeMap: Record<number, string> = {
      1: 'forge',
      4: 'fabric',
      5: 'quilt',
      6: 'neoforge',
    };

    const versionLoader = await curseForgeService.getVersionLoader(version);

    const result = versionLoader.map((v) => ({
      name: v.name.split('-')[1],
      gameVersion: v.gameVersion,
      latest: v.latest,
      recommended: v.recommended,
      type: LoaderTypeMap[v.type] || 'unknown',
    }));

    return c.json(result);
  });
