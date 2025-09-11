import { UpdateLauncherConfigDto } from '@shared/dtos/launcher.dto';
import { streamSSE } from 'hono/streaming';

import { Body, Context, Controller, Get, Post, Validate } from '~s/common/decorators';

import { launcherService } from './launcher.service';

@Controller('/launchers')
export class LauncherController {
  @Get('/config')
  async getConfig() {
    return launcherService.getConfig();
  }

  @Post('/config')
  @Validate(UpdateLauncherConfigDto)
  async setConfig(@Body() payload: UpdateLauncherConfigDto) {
    return launcherService.setConfig(payload);
  }

  @Get('/folder')
  async getFolder() {
    return launcherService.getFolder();
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
