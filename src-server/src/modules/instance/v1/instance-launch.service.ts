import { InstanceDto } from '@shared/dtos/instance.dto';
import { InstanceContentEnum } from '@shared/enums/general.enum';
import { CurseForgeModLoaderType } from 'curseforge-api';
import EventEmitter from 'events';
import { stat } from 'fs/promises';
import throttle from 'lodash/throttle';
import path from 'path';

import { NotFoundException } from '~/common/filters/exception.filter';
import { Mojang } from '~/libraries/minecraft-java-core/build/Index';
import Launch, { LaunchOPTS } from '~/libraries/minecraft-java-core/build/Launch';
import { BundleItem } from '~/libraries/minecraft-java-core/build/Minecraft/Minecraft-Bundle';

import { appService } from '../../app/app.service';
import { instanceService } from './instance.service';

export const instanceLaunchService = new (class InstanceLaunchService {
  private instanceLaunch = new Map<string, Launch>();
  private instanceLaunchEvent = new Map<string, EventEmitter>();
  private readonly DELAY_MS = 500;

  async launch(id: string) {
    const [instance, config] = await Promise.all([instanceService.findOne(id), appService.getConfig()]);

    if (this.instanceLaunch.has(id)) return this.instanceLaunchEvent.get(id);

    // Update metadata
    instanceService.update(id, { lastPlayed: new Date().toISOString() });

    const launch = new Launch();
    const event = new EventEmitter();

    this.instanceLaunch.set(id, launch);
    this.instanceLaunchEvent.set(id, event);

    const opts: LaunchOPTS = {
      path: config.minecraft.gameDir,
      version: instance.version,
      bypassOffline: true,
      authenticator: await Mojang.login(config.auth.username),
      loader: {
        path: '.',
        type: instance.loader ? CurseForgeModLoaderType[instance.loader.type].toLowerCase() : undefined,
        build: instance.loader?.build ?? 'latest',
        enable: !!instance.loader,
      },
      instance: path.join('..', 'versions', id),
      mcp: undefined,
      verify: false,
      forceGPU: config.minecraft.forceGPU,
      ignored: [],
      java: config.minecraft.java,
      screen: config.minecraft.screen,
      memory: {
        min: `${config.minecraft.memory.min}M`,
        max: `${config.minecraft.memory.max}M`,
      },
      downloadFileMultiple: config.downloadMultiple,
      JVM_ARGS: [],
      GAME_ARGS: [],
    };

    const bundleItems = await this.buildBundleItems(instance);

    launch
      .on(
        'progress',
        throttle((p, s) => {
          const percent = ((p / s) * 100).toFixed(2);
          this.instanceLaunchEvent.get(id)?.emit('progress', percent);
        }, this.DELAY_MS),
      )
      .on(
        'data',
        throttle((l) => this.instanceLaunchEvent.get(id)?.emit('log', l), this.DELAY_MS),
      )
      .on(
        'speed',
        throttle((s) => {
          if (typeof s === 'number' && !isNaN(s) && isFinite(s) && s > 0) {
            const speedMB = (s / 1024 / 1024).toFixed(2);
            this.instanceLaunchEvent.get(id)?.emit('speed', `${speedMB}MB/s`);
          }
        }, this.DELAY_MS),
      )
      .on(
        'estimated',
        throttle((e) => {
          if (typeof e === 'number' && !isNaN(e) && isFinite(e) && e > 0) {
            const m = Math.floor(e / 60);
            const s = Math.floor(e % 60);
            this.instanceLaunchEvent.get(id)?.emit('estimated', `${m}m ${s}s`);
          }
        }, this.DELAY_MS),
      )
      .on(
        'extract',
        throttle((e) => this.instanceLaunchEvent.get(id)?.emit('extract', e), this.DELAY_MS),
      )
      .on(
        'patch',
        throttle((p) => this.instanceLaunchEvent.get(id)?.emit('patch', p), this.DELAY_MS),
      )
      .on('close', () => {
        this.instanceLaunchEvent.get(id)?.emit('close');
        this.launchCleanup(id);
      })
      .on('cancelled', () => {
        this.instanceLaunchEvent.get(id)?.emit('cancelled');
        this.launchCleanup(id);
      })
      .on('error', (err) => {
        this.instanceLaunchEvent.get(id)?.emit('error', err);
        this.launchCleanup(id);
      });

    launch.Launch(opts, bundleItems);

    return event;
  }

  async cancel(id: string) {
    const launch = this.instanceLaunch.get(id);
    if (!launch) throw new NotFoundException('No active launch found for this instance');
    launch.cancel();
    return { message: 'Launch cancelled successfully' };
  }

  private async buildBundleItems(instance: InstanceDto): Promise<BundleItem[]> {
    const types = [InstanceContentEnum.Mods, InstanceContentEnum.ResourcePacks, InstanceContentEnum.ShaderPacks];

    const results = await Promise.all(
      types.map(async (type) => {
        const contents = instance[type];
        if (!Array.isArray(contents) || contents.length === 0) return [];

        const contentDir = await instanceService.getContentDir(instance.id, type);

        const validItems: BundleItem[] = [];

        await Promise.all(
          contents.map(async (content) => {
            const filePath = path.join(contentDir, content.fileName);

            try {
              const fileStat = await stat(filePath);
              if (fileStat.size !== content.fileLength) {
                validItems.push({
                  path: filePath,
                  sha1: content.hash,
                  size: content.fileLength,
                  url: content.fileUrl,
                  type,
                });
              }
            } catch {
              validItems.push({
                path: filePath,
                sha1: content.hash,
                size: content.fileLength,
                url: content.fileUrl,
                type,
              });
            }
          }),
        );

        return validItems;
      }),
    );

    return results.flat();
  }

  private launchCleanup(id: string) {
    const launch = this.instanceLaunch.get(id);
    const event = this.instanceLaunchEvent.get(id);

    if (launch) {
      launch.removeAllListeners();
      this.instanceLaunch.delete(id);
    }
    if (event) {
      event.removeAllListeners();
      this.instanceLaunchEvent.delete(id);
    }
  }
})();
