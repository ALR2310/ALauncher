import { SetConfigDto } from '@shared/dtos/app.dto';
import { streamSSE } from 'hono/streaming';

import { Body, Context, Controller, Get, Put, Validate } from '~/common/decorators';

import { appService } from './app.service';

@Controller('app')
export class AppController {
  @Get('status')
  getStatus = () => appService.getStatus();

  @Get('version')
  getVersion = () => appService.getVersion();

  @Get('exit')
  exit = () => appService.exit();

  @Get('config')
  async getConfig() {
    return appService.getConfig();
  }

  @Put('config')
  @Validate(SetConfigDto)
  async setConfig(@Body() body: SetConfigDto) {
    return appService.setConfig(body);
  }

  @Get('open-folder')
  openFolder = () => appService.openFolder();

  @Get('update/check')
  async checkForUpdates() {
    return appService.checkForUpdates();
  }

  @Get('update/install')
  async installUpdates(@Context() c) {
    const updater = await appService.installUpdates();

    if (!updater) {
      return streamSSE(c, async (stream) => {
        await stream.writeSSE({ event: 'done', data: 'No Update found' });
        await stream.close();
      });
    }

    return streamSSE(c, async (stream) => {
      const done = new Promise<void>((resolve) => {
        updater
          .on('progress', async (percent) => await stream.writeSSE({ event: 'progress', data: percent }))
          .on('done', async () => {
            await stream.writeSSE({ event: 'done', data: 'Download complete' });
            await stream.close();
            resolve();
          })
          .on('error', async (err) => {
            await stream.writeSSE({ event: 'error', data: err.message });
            await stream.close();
            resolve();
          });
      });

      await done;
    });
  }
}
