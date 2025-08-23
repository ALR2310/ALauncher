import { LauncherConfigType } from '@shared/launcher.type';
import EventEmitter from 'events';
import { readFile, writeFile } from 'fs/promises';
import set from 'lodash/set';
import path from 'path';

import { Launch, Mojang } from '~s/libs/minecraft-java-core/build/Index';

const launcherConfigs: LauncherConfigType = {
  window: {
    width: 400,
    height: 250,
    fullscreen: false,
    title: 'ALauncher',
  },
  theme: 'dark',
  language: 'vi',
  download_multiple: 5,
  username: '',
  version_selected: 'latest_release',
  minecraft: {
    width: 400,
    height: 250,
    fullscreen: false,
    gamedir: './minecraft',
    java: 'jre',
    language: 'vi',
    ram: '1024M',
  },
  auto_updates: true,
};

const LAUNCHER_CONFIG_PATH = path.join('launcher.json');

class LauncherService {
  private launcherInstance: Launch | null = null;

  async getConfig(): Promise<LauncherConfigType> {
    try {
      const data = await readFile(LAUNCHER_CONFIG_PATH, 'utf8');
      return JSON.parse(data) as LauncherConfigType;
    } catch (err: any) {
      console.error('Error reading launcher config:', err);
      const config = launcherConfigs as LauncherConfigType;
      await writeFile(LAUNCHER_CONFIG_PATH, JSON.stringify(config, null, 2));
      return config;
    }
  }

  async setConfig(keyPath: string, value: string | number | boolean) {
    const config = await this.getConfig();
    set(config, keyPath, value);
    await writeFile(LAUNCHER_CONFIG_PATH, JSON.stringify(config, null, 2));
    return config;
  }

  private cleanLauncherInstance() {
    if (this.launcherInstance) {
      this.launcherInstance.removeAllListeners();
      this.launcherInstance = null;
    }
  }

  async launch() {
    try {
      if (this.launcherInstance) {
        throw new Error('Launcher is already running');
      }

      this.launcherInstance = new Launch();

      const emitter = new EventEmitter();
      const config = await this.getConfig();
      const auth = await Mojang.login(config.username);

      this.launcherInstance
        .on('progress', (p, s) => emitter.emit('progress', p, s))
        .on('data', (line) => emitter.emit('log', line.toString()))
        .on('speed', (s) => emitter.emit('speed', s))
        .on('estimated', (t) => emitter.emit('estimated', t))
        .on('extract', (e) => emitter.emit('extract', e))
        .on('patch', (e) => emitter.emit('patch', e))
        .on('close', () => {
          emitter.emit('close');
          this.cleanLauncherInstance();
        })
        .on('error', (err) => {
          emitter.emit('error', err);
          this.cleanLauncherInstance();
        })
        .on('cancelled', () => {
          emitter.emit('cancelled');
          this.cleanLauncherInstance();
        });

      this.launcherInstance.Launch({
        path: config.minecraft.gamedir,
        version: config.version_selected,
        bypassOffline: true,
        authenticator: auth,
        loader: {
          path: '.',
          type: 'forge',
          build: 'latest',
          enable: false,
        },
        instance: '',
        mcp: undefined,
        verify: false,
        ignored: [],
        java: {
          type: config.minecraft.java,
        },
        screen: {
          width: config.minecraft.width,
          height: config.minecraft.height,
          fullscreen: config.minecraft.fullscreen,
        },
        memory: {
          min: config.minecraft.ram,
          max: config.minecraft.ram,
        },
        downloadFileMultiple: 5,
        JVM_ARGS: [],
        GAME_ARGS: [],
      });

      return emitter;
    } catch (err: any) {
      console.error('Error launching:', err);
      if (this.launcherInstance) {
        this.launcherInstance.removeAllListeners();
        this.launcherInstance = null;
      }
      return null;
    }
  }

  async cancel() {
    try {
      if (this.launcherInstance) {
        this.launcherInstance.removeAllListeners();
        this.launcherInstance.cancel();
        this.launcherInstance = null;
      }
      return true;
    } catch {
      return false;
    }
  }
}

export const launcherService = new LauncherService();
