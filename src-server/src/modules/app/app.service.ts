import axios from 'axios';
import { spawn } from 'child_process';
import EventEmitter from 'events';
import { unzipSync } from 'fflate';
import { mkdir, readFile, rm, writeFile } from 'fs/promises';
import throttle from 'lodash/throttle';
import path from 'path';
import semver from 'semver';

import { Downloader } from '~/libraries/minecraft-java-core/build/Index';

import pkg from '../../../../package.json' assert { type: 'json' };

class AppService {
  private isUpdating = false;

  getStatus() {
    return { status: 'ok' };
  }

  getVersion() {
    return { version: pkg.version };
  }

  exit() {
    process.exit(0);
  }

  async checkUpdate() {
    const currentVersion = this.getVersion().version;
    const gitToken = process.env.NODE_ENV === 'development' ? process.env.GITHUB_TOKEN : undefined;

    try {
      const res = await axios.get('https://api.github.com/repos/ALR2310/ALauncher/releases/latest', {
        headers: gitToken ? { Authorization: `token ${gitToken}` } : undefined,
      });
      const latest = res.data;
      const latestVersion = latest?.tag_name?.replace(/^v/, '') ?? '0.0.0';
      const hasUpdate = semver.gt(latestVersion, currentVersion);

      return {
        hasUpdate,
        assets: (latest?.assets as any[]) ?? [],
      };
    } catch (err: any) {
      console.error('Check update error:', err?.message ?? err);
      return {
        hasUpdate: false,
        assets: [],
      };
    }
  }

  async update() {
    if (this.isUpdating) return null;
    this.isUpdating = true;

    try {
      const check = await this.checkUpdate();

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
}

export const appService = new AppService();
