import { AppConfigDto, JAVA_TYPE, SetConfigDto } from '@shared/dtos/app.dto';
import { ENV } from '@shared/enums/general.enum';
import { Mutex } from 'async-mutex';
import axios from 'axios';
import { spawn } from 'child_process';
import EventEmitter from 'events';
import { unzipSync } from 'fflate';
import { mkdir, readFile, rm, writeFile } from 'fs/promises';
import set from 'lodash/set';
import throttle from 'lodash/throttle';
import path from 'path';
import semver from 'semver';

import { Downloader } from '~/libraries/minecraft-java-core/build/Index';

import pkg from '../../../../package.json' assert { type: 'json' };

const appConfig: AppConfigDto = {
  // General
  language: 'vi',
  theme: 'dark',
  autoUpdate: true,
  downloadMultiple: 5,
  // Auth
  auth: {
    type: 'offline',
    username: 'Player',
  },
  // Minecraft
  minecraft: {
    verify: false,
    gameDir: '.minecraft',
    java: {
      type: JAVA_TYPE.JDK,
    },
    memory: {
      min: 512,
      max: 1024,
    },
    screen: {
      width: 400,
      height: 250,
      fullscreen: false,
    },
  },
};

export const appService = new (class AppService {
  private readonly CONFIG_PATH = path.resolve('launcher.json');
  private setConfigMutex = new Mutex();
  private isUpdating = false;
  private updateCache: { hasUpdate: boolean; assets: any[] } | null = null;
  private cacheTimestamp: number | null = null;
  private readonly CACHE_TTL = 5 * 60 * 1000;

  getStatus() {
    return { status: 'ok' };
  }

  getVersion() {
    return { version: pkg.version };
  }

  exit() {
    process.exit(0);
  }

  async getConfig(): Promise<AppConfigDto> {
    try {
      const config = await readFile(this.CONFIG_PATH, 'utf-8');
      return JSON.parse(config);
    } catch (error) {
      await writeFile(this.CONFIG_PATH, JSON.stringify(appConfig, null, 2), 'utf-8');
      return appConfig;
    }
  }

  async setConfig(payload: SetConfigDto) {
    return this.setConfigMutex.runExclusive(async () => {
      const config = await this.getConfig();
      try {
        const { key, value } = payload;

        set(config, key, value);
        await writeFile(this.CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
        return config;
      } catch (error) {
        return config;
      }
    });
  }

  async openFolder() {
    const config = await this.getConfig();
    const gameDir = path.resolve(config.minecraft.gameDir);
    const platform = process.platform;

    if (platform === 'win32') spawn('explorer', [gameDir]);
    else if (platform === 'darwin') spawn('open', [gameDir]);
    else spawn('xdg-open', [gameDir]);
    return { success: true };
  }

  async checkForUpdates(forceRefresh = false) {
    const currentVersion = this.getVersion().version;
    const gitToken = process.env.NODE_ENV === ENV.Development ? process.env.GITHUB_TOKEN : undefined;

    const now = Date.now();
    if (!forceRefresh && this.updateCache && this.cacheTimestamp && now - this.cacheTimestamp < this.CACHE_TTL) {
      return this.updateCache;
    }

    try {
      const res = await axios.get('https://api.github.com/repos/ALR2310/ALauncher/releases/latest', {
        headers: gitToken ? { Authorization: `token ${gitToken}` } : undefined,
      });
      const latest = res.data;
      const latestVersion = latest?.tag_name?.replace(/^v/, '') ?? '0.0.0';
      const hasUpdate = semver.gt(latestVersion, currentVersion);

      const result = {
        hasUpdate,
        assets: (latest?.assets as any[]) ?? [],
      };

      this.updateCache = result;
      this.cacheTimestamp = now;

      return result;
    } catch (err: any) {
      console.error('Check update error:', err?.message ?? err);
      const errorResult = {
        hasUpdate: false,
        assets: [],
      };

      if (this.updateCache) {
        return this.updateCache;
      }

      return errorResult;
    }
  }

  async installUpdates() {
    if (this.isUpdating) return null;
    this.isUpdating = true;

    try {
      const check = await this.checkForUpdates();

      if (!check.hasUpdate) {
        this.isUpdating = false;
        return null;
      }

      const asset = check.assets.find((a: any) => a.name.includes('Update.zip'));

      if (!asset) {
        this.isUpdating = false;
        return null;
      }

      const fileUrl = asset.browser_download_url;
      const fileName = asset.name;

      const downloader = new Downloader();
      const event = new EventEmitter();

      downloader.downloadFile(fileUrl, './', fileName);
      downloader
        .on(
          'progress',
          throttle(async (p, s) => {
            event.emit('progress', ((p / s) * 100).toFixed(2));

            if (p >= s) {
              try {
                event.emit('done');
                await rm(path.resolve('assets'), { recursive: true, force: true }).catch(() => {});
                await this.decompress(path.resolve(fileName), path.resolve());
                await rm(path.resolve(fileName), { force: true });
                this.updateCache = null;
                this.cacheTimestamp = null;
                this.reloadRuntime();
              } catch (err) {
                event.emit('error', err);
              }
            }
          }, 500),
        )
        .on('error', (err) => {
          event.emit('error', err);
          this.isUpdating = false;
        });

      return event;
    } catch (err) {
      this.isUpdating = false;
      throw err;
    } finally {
      this.isUpdating = false;
    }
  }

  private async decompress(filePath: string, outDir: string) {
    const data = await readFile(filePath);
    const unzipped = unzipSync(new Uint8Array(data));
    const entries = Object.keys(unzipped);

    for (const entry of entries) {
      if (entry.endsWith('/')) continue;

      const content = unzipped[entry];
      const outFile = path.join(outDir, entry);
      const dir = path.dirname(outFile);

      await mkdir(dir, { recursive: true });
      await writeFile(outFile, content);
    }
  }

  private reloadRuntime() {
    const args = process.argv.slice(1);

    const child = spawn(process.execPath, args, {
      detached: true,
      stdio: 'ignore',
    });
    child.unref();
    process.exit(0);
  }
})();
