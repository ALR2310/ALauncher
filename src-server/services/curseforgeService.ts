import { GetMinecraftVersion, GetVersionLoader } from '@shared/curseforge.type';
import axios from 'axios';

const API_KEY = process.env.VITE_CURSEFORGE_API_KEY;

const api = axios.create({
  baseURL: 'https://api.curseforge.com/v1',
  headers: {
    'x-api-key': API_KEY,
  },
});

class CurseForgeService {
  async getMinecraftVersion(): Promise<GetMinecraftVersion[]> {
    try {
      const res = await api.get('minecraft/version');
      return res.data.data;
    } catch (e) {
      console.error('Error fetching Minecraft version:', e);
      return [];
    }
  }

  async getVersionLoader(minecraftVersion: string): Promise<GetVersionLoader[]> {
    try {
      const res = await api.get(`minecraft/modloader?version=${minecraftVersion}&includeAll=true`);
      return res.data.data;
    } catch (e) {
      console.error('Error fetching version loader:', e);
      return [];
    }
  }
}

export const curseForgeService = new CurseForgeService();
