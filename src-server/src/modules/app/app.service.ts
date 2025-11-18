import { AppConfigDto, AppSystemInfoDto, AppVersionDto, JAVA_TYPE, SetConfigDto } from '@shared/dtos/app.dto';
import { ENV } from '@shared/enums/general.enum';
import { Mutex } from 'async-mutex';
import { execSync, spawn } from 'child_process';
import EventEmitter from 'events';
import { readFile, rm, writeFile } from 'fs/promises';
import set from 'lodash/set';
import throttle from 'lodash/throttle';
import os from 'os';
import path from 'path';
import axios from 'redaxios';
import semver from 'semver';

import { Downloader } from '~/libraries/minecraft-java-core/build/Index';
import { Zipper } from '~/utils';

import pkg from '../../../../package.json' assert { type: 'json' };
import pkgTauri from '../../../../src-tauri/tauri.conf.json' assert { type: 'json' };

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
    forceGPU: true,
    verify: false,
    gameDir:
      process.env.NODE_ENV === ENV.Development
        ? path.resolve('.minecraft')
        : path.resolve(process.env.APPDATA ?? '', '.minecraft'),
    java: {
      type: JAVA_TYPE.JDK,
    },
    memory: {
      min: 1024,
      max: 1024,
    },
    screen: {
      width: 854,
      height: 480,
      fullscreen: false,
    },
  },
};
export const appService = new (class AppService {
  private readonly CONFIG_PATH = path.resolve('launcher.json');
  private configCache: AppConfigDto | null = null;
  private setConfigMutex = new Mutex();
  private isUpdating = false;
  private updateCache: { hasUpdate: boolean; assets: any[] } | null = null;
  private cacheTimestamp: number | null = null;
  private readonly CACHE_TTL = 5 * 60 * 1000;

  getStatus() {
    return { status: 'ok' };
  }

  getVersion(): AppVersionDto {
    return {
      coreVersion: pkgTauri.version,
      dataVersion: pkg.version,
    };
  }

  exit() {
    process.exit(0);
  }

  async getSystemInfo(): Promise<AppSystemInfoDto> {
    const cpus = os.cpus();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();

    const platform = os.platform();
    let gpu: { model: string; memory: number }[] = [];
    if (platform === 'win32') gpu = this.getGPUInfoWin();
    else if (platform === 'darwin') gpu = this.getGPUInfoMac();
    else gpu = this.getGPUInfoLinux();

    return {
      platform,
      arch: os.arch(),
      os: {
        release: os.release(),
        hostname: os.hostname(),
      },
      cpu: {
        model: cpus[0]?.model || 'Unknown',
        cores: cpus.length,
        speed: cpus[0]?.speed || 0,
      },
      memory: {
        total: totalMem,
        free: freeMem,
      },
      gpu,
    };
  }

  async getConfig(): Promise<AppConfigDto> {
    if (this.configCache) return this.configCache;

    try {
      const config = await readFile(this.CONFIG_PATH, 'utf-8');
      this.configCache = JSON.parse(config);
      return this.configCache!;
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
    const currentVersion = this.getVersion().dataVersion;
    const gitToken = process.env.NODE_ENV === ENV.Development ? process.env.GITHUB_TOKEN : undefined;

    const now = Date.now();
    if (!forceRefresh && this.updateCache && this.cacheTimestamp && now - this.cacheTimestamp < this.CACHE_TTL) {
      return this.updateCache;
    }

    try {
      const res = await axios.get(`https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}/releases/latest`, {
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
      const zipper = new Zipper();

      downloader.downloadFile(fileUrl, './', fileName);
      downloader
        .on(
          'progress',
          throttle(async (p, s) => {
            event.emit('progress', ((p / s) * 100).toFixed(2));

            if (p >= s) {
              try {
                await rm(path.resolve('assets'), { recursive: true, force: true }).catch(() => {});
                await zipper.decompress(path.resolve(fileName), path.resolve());
                await rm(path.resolve(fileName), { force: true });

                this.updateCache = null;
                this.cacheTimestamp = null;

                event.emit('done');
                setTimeout(() => {
                  this.reloadRuntime();
                }, 100);
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

  private reloadRuntime() {
    const args = process.argv.slice(1);

    const child = spawn(process.execPath, args, {
      detached: true,
      stdio: 'ignore',
    });
    child.unref();
    process.exit(0);
  }

  private getGPUInfoWin() {
    try {
      const output = execSync('wmic path win32_VideoController get Name,AdapterRAM', { encoding: 'utf8' });
      const lines = output.trim().split('\n').slice(1);
      return lines
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const [name, ram] = line.split(/\s{2,}/);
          return {
            model: name.trim(),
            memory: Number(ram?.trim() || 0) / 1024 / 1024, // MB
          };
        });
    } catch {
      return [];
    }
  }

  private getGPUInfoMac() {
    try {
      const output = execSync('system_profiler SPDisplaysDataType', { encoding: 'utf8' });
      const matches = [...output.matchAll(/Chipset Model: (.+)/g)];
      return matches.map((m) => ({ model: m[1], memory: 0 }));
    } catch {
      return [];
    }
  }

  private getGPUInfoLinux() {
    try {
      const output = execSync('lspci | grep -i vga', { encoding: 'utf8' });
      return output
        .split('\n')
        .filter(Boolean)
        .map((line) => ({ model: line.split(':').pop()?.trim() || 'Unknown', memory: 0 }));
    } catch {
      return [];
    }
  }
})();
