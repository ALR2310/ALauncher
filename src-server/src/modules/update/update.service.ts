import axios from 'axios';
import { spawn } from 'child_process';
import EventEmitter from 'events';
import { existsSync, statSync } from 'fs';
import throttle from 'lodash/throttle';
import path from 'path';
import semver from 'semver';

import { Downloader } from '~/libraries/minecraft-java-core/build/Index';

class UpdateService {
  private isRunning = false;

  async check(payload: any) {
    if (this.isRunning) return null;

    this.isRunning = true;

    try {
      const { version } = payload;
      const res = await axios.get('https://api.github.com/repos/ALR2310/ALauncher/releases/latest');

      const latest = res.data;
      if (!latest || semver.lte(latest.tag_name.replace(/^v/, ''), version)) {
        this.isRunning = false;
        return null;
      }

      const asset = latest.assets.find((a: any) => a.name.endsWith('.exe'));
      if (!asset) {
        this.isRunning = false;
        return null;
      }

      const fileUrl = asset.browser_download_url;
      const fileName = asset.name;
      const dirPath = path.resolve('updates');
      const filePath = path.join(dirPath, fileName);

      const downloader = new Downloader();
      const event = new EventEmitter();

      if (existsSync(filePath)) {
        const stats = statSync(filePath);
        if (stats.size === asset.size) {
          event.emit('progress', '100.00');
          event.emit('done');
          this.install(filePath);
          this.isRunning = false;
          return event;
        }
      }

      downloader.downloadFile(fileUrl, dirPath, fileName);
      downloader
        .on(
          'progress',
          throttle((p, s) => {
            event.emit('progress', ((p / s) * 100).toFixed(2));

            if (p >= s) {
              event.emit('done');
              this.install(filePath);
              this.isRunning = false;
            }
          }, 500),
        )
        .on('error', (err) => {
          event.emit('error', err);
          this.isRunning = false;
        });

      return event;
    } catch (err) {
      this.isRunning = false;
      throw err;
    }
  }

  private install(filePath: string) {
    const app = path.join(process.execPath, '..', 'alauncher.exe');

    spawn('updater.exe', [filePath, app, '/P'], {
      detached: true,
      stdio: 'ignore',
    });

    process.exit(0);
  }
}

export const updateService = new UpdateService();
