import { readdir } from 'fs/promises';
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

export default versionController
  .get('/', async (c) => {
    const [versions, versionDownloaded] = await Promise.all([
      curseForgeService.getMinecraftVersion(),
      getVersionDownloaded(),
    ]);

    const result = versions
      .filter((v) => !v.versionString.toLocaleLowerCase().includes('snapshot'))
      .map((v) => ({
        name: `Release ${v.versionString}`,
        version: v.versionString,
        downloaded: versionDownloaded.includes(v.versionString),
      }));

    return c.json(result);
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
