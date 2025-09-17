import { LauncherConfigDto, UpdateLauncherConfigDto } from '@shared/dtos/launcher.dto';
import { readFile, writeFile } from 'fs/promises';
import set from 'lodash/set';
import path from 'path';

const LAUNCHER_CONFIG_PATH = path.join('launcher.json');

const launcherConfig: LauncherConfigDto = {
  profile_selected: {
    name: 'Latest Release',
    type: 'release',
    version: 'latest_release',
    loader: undefined,
    instance: undefined,
  },
  auth: {
    type: 'offline',
    username: '',
  },
  theme: 'dark',
  language: 'vi',
  download_multiple: 5,
  minecraft: {
    width: 400,
    height: 250,
    fullscreen: false,
    gamedir: './minecraft',
    java: {
      type: 'jdk',
    },
    language: 'vi',
    ram: 1024,
  },
  auto_updates: true,
};

class ConfigService {
  async getConfig() {
    try {
      const config = await readFile(LAUNCHER_CONFIG_PATH, 'utf-8');
      return JSON.parse(config) as LauncherConfigDto;
    } catch (err: any) {
      await writeFile(LAUNCHER_CONFIG_PATH, JSON.stringify(launcherConfig, null, 2), 'utf-8');
      return launcherConfig;
    }
  }

  async setConfig(payload: UpdateLauncherConfigDto) {
    const { key, value } = payload;
    const config = await this.getConfig();
    set(config, key, value);
    await writeFile(LAUNCHER_CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
    return config;
  }
}

export const configService = new ConfigService();
