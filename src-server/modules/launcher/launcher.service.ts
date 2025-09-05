import { LauncherConfig } from '@shared/types/launcher';
import { spawn } from 'child_process';
import EventEmitter from 'events';
import { readFile, writeFile } from 'fs/promises';
import set from 'lodash/set';
import throttle from 'lodash/throttle';
import path from 'path';

import { Launch, Mojang } from '~s/libraries/minecraft-java-core/build/Index';

const LAUNCHER_CONFIG_PATH = path.join('launcher.json');

const launcherConfig: LauncherConfig = {
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

class LauncherService {
  private launchInstance: Launch | null = null;
  private launchEmitter: EventEmitter | null = null;

  async getConfig() {
    try {
      const config = await readFile(LAUNCHER_CONFIG_PATH, 'utf-8');
      return JSON.parse(config) as LauncherConfig;
    } catch (err: any) {
      await writeFile(LAUNCHER_CONFIG_PATH, JSON.stringify(launcherConfig, null, 2), 'utf-8');
      return launcherConfig;
    }
  }

  async setConfig(key: keyof LauncherConfig, value: any) {
    const config = await this.getConfig();
    set(config, key, value);
    await writeFile(LAUNCHER_CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
    return config;
  }

  async getFolder() {
    const config = await this.getConfig();
    const folderPath = path.resolve(config.minecraft.gamedir);
    const platform = process.platform;

    if (platform === 'win32') spawn('explorer', [folderPath]);
    else if (platform === 'darwin') spawn('open', [folderPath]);
    else spawn('xdg-open', [folderPath]);
    return { success: true };
  }

  async launch() {
    const DELAY = 500;

    try {
      if (this.launchInstance) return this.launchEmitter;

      this.launchInstance = new Launch();
      this.launchEmitter = new EventEmitter();

      const config = await this.getConfig();
      const auth = await Mojang.login(config.auth.username || 'Player');

      this.launchInstance.Launch({
        path: config.minecraft.gamedir,
        version: config.profile_selected.version,
        bypassOffline: true,
        authenticator: auth,
        loader: {
          path: '.',
          type: config.profile_selected.loader?.type,
          build: config.profile_selected.loader?.version ?? 'latest',
          enable: config.profile_selected.loader ? true : false,
        },
        instance: config.profile_selected.instance && `../versions/${config.profile_selected.instance}`,
        mcp: undefined,
        verify: false,
        ignored: [],
        java: config.minecraft.java as any,
        screen: {
          width: config.minecraft.width,
          height: config.minecraft.height,
          fullscreen: config.minecraft.fullscreen,
        },
        memory: {
          min: `${Math.floor(config.minecraft.ram / 2)}M`,
          max: `${config.minecraft.ram}M`,
        },
        downloadFileMultiple: config.download_multiple,
        JVM_ARGS: [],
        GAME_ARGS: [],
      });

      this.launchInstance
        .on(
          'progress',
          throttle((p, s) => {
            const percent = ((p / s) * 100).toFixed(2);
            this.launchEmitter?.emit('progress', percent);
          }, DELAY),
        )
        .on(
          'data',
          throttle((l) => this.launchEmitter?.emit('log', l), DELAY),
        )
        .on(
          'speed',
          throttle((s) => {
            const speedMB = (s / 1024 / 1024).toFixed(2);
            this.launchEmitter?.emit('speed', `${speedMB}MB/s`);
          }, DELAY),
        )
        .on(
          'estimated',
          throttle((e) => {
            const m = Math.floor(e / 60);
            const s = Math.floor(e % 60);
            this.launchEmitter?.emit('estimated', `${m}m ${s}s`);
          }, DELAY),
        )
        .on(
          'extract',
          throttle((e) => this.launchEmitter?.emit('extract', e), DELAY),
        )
        .on(
          'patch',
          throttle((p) => this.launchEmitter?.emit('patch', p), DELAY),
        )
        .on('close', () => {
          this.launchEmitter?.emit('close');
          this.cleanup();
        })
        .on('cancelled', () => {
          this.launchEmitter?.emit('cancelled');
          this.cleanup();
        })
        .on('error', (err) => {
          this.launchEmitter?.emit('error', err);
          this.cleanup();
        });

      return this.launchEmitter;
    } catch (err) {
      this.cleanup();
      console.error(err);
      return null;
    }
  }

  cancel() {
    try {
      this.launchInstance?.cancel();
      this.cleanup();
      return true;
    } catch (err) {
      console.error(err);
      this.cleanup();
      return false;
    }
  }

  private cleanup() {
    if (this.launchInstance) {
      this.launchInstance.removeAllListeners();
      this.launchEmitter?.removeAllListeners();
      this.launchEmitter = null;
      this.launchInstance = null;
    }
  }
}

export const launcherService = new LauncherService();
