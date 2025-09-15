import { UpdateLauncherConfigDto } from '@shared/dtos/launcher.dto';
import { streamSSE } from 'hono/streaming';
import throttle from 'lodash/throttle';

import { Body, Context, Controller, Get, Post, Validate } from '~s/common/decorators';

import { configService } from '../config/config.service';
import { launcherService } from './launcher.service';

@Controller('/launchers')
export class LauncherController {
  @Get('/config')
  async getConfig() {
    return configService.getConfig();
  }

  @Post('/config')
  @Validate(UpdateLauncherConfigDto)
  async setConfig(@Body() payload: UpdateLauncherConfigDto) {
    return configService.setConfig(payload);
  }

  @Get('/folder')
  async getFolder() {
    return launcherService.getFolder();
  }

  @Get('/verify')
  async verify(@Context() c) {
    const downloader = await launcherService.verify();
    if (!downloader) {
      return streamSSE(c, async (stream) => {
        await stream.writeSSE({ event: 'done', data: 'Verification complete' });
        await stream.close();
      });
    }

    return streamSSE(c, async (stream) => {
      const DELAY = 500;
      const done = new Promise<void>((resolve) => {
        downloader
          .on(
            'progress',
            throttle(async (p, s) => {
              const percent = ((p / s) * 100).toFixed(2);

              await stream.writeSSE({ event: 'progress', data: percent });

              if (percent === '100.00') {
                await stream.writeSSE({ event: 'done', data: 'Download complete' });
                setTimeout(async () => {
                  await stream.close();
                  resolve();
                }, 100);
              }
            }, DELAY),
          )
          .on(
            'speed',
            throttle(async (s) => {
              const speedMB = (s / 1024 / 1024).toFixed(2);
              await stream.writeSSE({ event: 'speed', data: `${speedMB}MB/s` });
            }, DELAY),
          )
          .on(
            'estimated',
            throttle(async (e) => {
              // Check if the estimated time is valid
              if (!isFinite(e) || isNaN(e) || e < 0) {
                await stream.writeSSE({ event: 'estimated', data: '' });
                return;
              }

              const m = Math.floor(e / 60);
              const s = Math.floor(e % 60);

              if (!isFinite(m) || !isFinite(s) || isNaN(m) || isNaN(s)) {
                await stream.writeSSE({ event: 'estimated', data: '' });
                return;
              }

              await stream.writeSSE({ event: 'estimated', data: `${m}m ${s}s` });
            }, DELAY),
          )
          .on('error', async (err) => {
            await stream.writeSSE({ event: 'error', data: JSON.stringify(err) });
            await stream.close();
            resolve();
          });
      });

      await done;
    });
  }

  @Get('/launch')
  async launch(@Context() c) {
    const launcher = await launcherService.launch();

    if (!launcher) {
      return streamSSE(c, async (stream) => {
        await stream.writeSSE({ event: 'error', data: 'Cannot launch' });
        await stream.close();
      });
    }

    return streamSSE(c, async (stream) => {
      const done = new Promise<void>((resolve) =>
        launcher
          .on('progress', async (p) => await stream.writeSSE({ event: 'progress', data: p }))
          .on('log', async (l) => await stream.writeSSE({ event: 'log', data: l }))
          .on('speed', async (s) => await stream.writeSSE({ event: 'speed', data: s }))
          .on('estimated', async (e) => await stream.writeSSE({ event: 'estimated', data: e }))
          .on('extract', async (e) => await stream.writeSSE({ event: 'extract', data: e }))
          .on('patch', async (p) => await stream.writeSSE({ event: 'patch', data: p }))
          .on('close', async () => {
            await stream.writeSSE({ event: 'close', data: 'Launch closed' });
            await stream.close();
            resolve();
          })
          .on('cancelled', async () => {
            await stream.writeSSE({ event: 'cancelled', data: 'Launch cancelled' });
            await stream.close();
            resolve();
          })
          .on('error', async (err) => {
            await stream.writeSSE({ event: 'error', data: JSON.stringify(err) });
            await stream.close();
            resolve();
          }),
      );

      await done;
    });
  }

  @Get('/cancel')
  async cancel() {
    return launcherService.cancel();
  }
}
