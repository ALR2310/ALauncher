import { ContentDto } from '@shared/dtos/content.dto';
import { categoryMap } from '@shared/mappings/general.mapping';
import { spawn } from 'child_process';
import EventEmitter from 'events';
import throttle from 'lodash/throttle';
import path from 'path';

import { Mojang } from '~/libraries/minecraft-java-core/build/Index';
import Launch from '~/libraries/minecraft-java-core/build/Launch';

import { configService } from '../config/config.service';
import { instanceService } from '../instance/instance.service';

class LauncherService {
  private launchInstance: Launch | null = null;
  private launchEmitter: EventEmitter | null = null;

  async getFolder() {
    const config = await configService.getConfig();
    const folderPath = path.resolve(config.minecraft.gamedir);
    const platform = process.platform;

    if (platform === 'win32') spawn('explorer', [folderPath]);
    else if (platform === 'darwin') spawn('open', [folderPath]);
    else spawn('xdg-open', [folderPath]);
    return { success: true };
  }

  async verify() {
    this.launchEmitter = new EventEmitter();

    const config = await configService.getConfig();

    const isInstance = !!config.profile_selected.instance;

    if (isInstance) {
      const instance = await instanceService.findOne(config.profile_selected.instance!);

      const groupedContents: Record<string, ContentDto[]> = {};
      const contentTypes = Object.values(categoryMap.idToText).map((t) => t.toLowerCase().replace(/\s+/g, ''));

      for (const type of contentTypes) {
        const contents: ContentDto[] = instance[type];
        if (contents?.length) {
          groupedContents[type] = contents;
        }
      }

      return instanceService.handleDownloadContents(groupedContents, instance.id!, config.download_multiple);
    }
  }

  async launch() {
    const DELAY = 500;

    try {
      if (this.launchInstance) return this.launchEmitter;

      this.launchInstance = new Launch();
      this.launchEmitter = new EventEmitter();

      const config = await configService.getConfig();
      const auth = await Mojang.login(config.auth.username || 'Player');

      const isInstance = !!config.profile_selected.instance;

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
        instance: isInstance ? `../versions/${config.profile_selected.instance}` : undefined,
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
