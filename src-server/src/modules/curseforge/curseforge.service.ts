import axios from 'axios';
import { CurseForgeClient } from 'curseforge-api';
import {
  CurseForgeGetCategoriesOptions,
  CurseForgeGetMinecraftModLoadersOptions,
  CurseForgeGetModFilesOptions,
  CurseForgeSearchModsOptions,
} from 'curseforge-api/v1/Options';
import { CurseForgeMinecraftModLoaderIndex } from 'curseforge-api/v1/Types';

const API_KEY = process.env.CURSEFORGE_API_KEY ?? '';

const API = axios.create({
  baseURL: 'https://api.curseforge.com/v1',
  headers: { 'x-api-key': API_KEY },
});

class CurseForgeService {
  private client = new CurseForgeClient(API_KEY);
  private gameId = 432; // Minecraft

  async getCategories(payload: CurseForgeGetCategoriesOptions) {
    return this.client.getCategories(this.gameId, payload);
  }

  async searchMods(payload: CurseForgeSearchModsOptions) {
    return this.client.searchMods(this.gameId, payload);
  }

  async getMods(modIds: number[]) {
    return this.client.getMods(modIds);
  }

  async getModDescription(modId: number) {
    return this.client.getModDescription(modId);
  }

  async getModFiles(modId: number, options: CurseForgeGetModFilesOptions) {
    return this.client.getModFiles(modId, options);
  }

  async getMinecraftVersions() {
    return this.client.getMinecraftVersions();
  }

  async getMinecraftModLoaders(options?: CurseForgeGetMinecraftModLoadersOptions) {
    if (options?.version) return this.client.getMinecraftModLoaders(options);
    return API.get(`/minecraft/modloader`, { params: { includeAll: true } }).then(
      (res) => res.data.data as CurseForgeMinecraftModLoaderIndex[],
    );
  }
}

export const curseForgeService = new CurseForgeService();
