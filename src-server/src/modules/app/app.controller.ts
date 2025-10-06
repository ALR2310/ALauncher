import { streamSSE } from 'hono/streaming';

import { Context, Controller, Get } from '~/common/decorators';

import { appService } from './app.service';

@Controller('app')
export class AppController {
  @Get('status')
  getStatus = () => appService.getStatus();

  @Get('version')
  getVersion = () => appService.getVersion();

  @Get('exit')
  exit = () => appService.exit();

  @Get('update/check')
  checkUpdate = () => appService.checkUpdate();

  @Get('update')
  async update(@Context() c) {
    const downloader = await appService.update();

    if (!downloader) {
      return streamSSE(c, async (stream) => {
        await stream.writeSSE({ event: 'done', data: 'No Update found' });
        await stream.close();
      });
    }

    return streamSSE(c, async (stream) => {
      const done = new Promise<void>((resolve) => {
        downloader
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
