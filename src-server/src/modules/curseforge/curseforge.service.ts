import { loaderMap } from '@shared/mappings/general.mapping';
import axios from 'axios';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ quiet: true, path: resolve(__dirname, '../../../../.env') });

const API_KEY = process.env.VITE_CURSEFORGE_API_KEY;

const api = axios.create({
  baseURL: 'https://api.curseforge.com/v1',
  headers: {
    'x-api-key': API_KEY,
  },
});

class CurseForgeService {
  async getMinecraftVersions() {
    try {
      const res = await api.get('/minecraft/version');
      return res.data;
    } catch (err) {
      console.error('Error fetching Minecraft version:', err);
      return [];
    }
  }

  async getLoaderVersions(version?: string) {
    try {
      const res = await api.get(`minecraft/modloader`, {
        params: {
          includeAll: true,
          version,
        },
      });
      return res.data;
    } catch (e) {
      console.error('Error fetching Loader version:', e);
      return [];
    }
  }

  async getModFiles(modId: number, gameVersion?: string, modLoaderType?: string, pageSize = 1) {
    const modLoader = modLoaderType ? loaderMap.keyToId[modLoaderType] : undefined;

    try {
      const res = await api.get(`mods/${modId}/files`, {
        params: {
          gameVersion,
          modLoaderType: modLoader,
          pageSize,
        },
      });
      return res.data;
    } catch (e) {
      console.error('Error fetching mod files:', e);
      return [];
    }
  }

  async getCategories(gameId: number, classId?: number, classesOnly?: boolean) {
    try {
      const res = await api.get('categories', { params: { gameId, classId, classesOnly } });
      return res.data;
    } catch (e) {
      console.error('Error fetching categories:', e);
      return [];
    }
  }

  async searchMods(params: any) {
    const {
      gameId = 432,
      classId,
      categoryIds,
      gameVersion,
      searchFilter,
      sortField,
      sortOrder = 'desc',
      modLoaderType,
      slug,
      index = 0,
      pageSize = 20,
    } = params;

    try {
      const res = await api.get('mods/search', {
        params: {
          gameId,
          classId,
          categoryIds,
          gameVersion,
          searchFilter,
          sortField,
          sortOrder,
          modLoaderType,
          slug,
          index: index * pageSize,
          pageSize,
        },
      });
      return res.data;
    } catch (e) {
      console.error('Error searching mods:', e);
      return [];
    }
  }

  async getMods(payload: { modIds: number[]; filterPcOnly?: boolean }) {
    const { modIds, filterPcOnly = true } = payload;
    try {
      const res = await api.post('mods', { modIds, filterPcOnly });
      return res.data;
    } catch (e) {
      console.error('Error fetching mods:', e);
      return [];
    }
  }

  async getMod(modId: number) {
    try {
      const res = await api.get(`mods/${modId}`);
      return res.data;
    } catch (e) {
      console.error('Error fetching mod:', e);
      return null;
    }
  }

  async getModDescription(modId: number) {
    try {
      const res = await api.get(`mods/${modId}/description`);
      return res.data;
    } catch (e) {
      console.error('Error fetching mod description:', e);
      return null;
    }
  }
}

export const curseForgeService = new CurseForgeService();
