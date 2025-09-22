import { streamSSE } from 'hono/streaming';

import { Context, Controller, Get, Query } from '~/common/decorators';

import { updateService } from './update.service';

@Controller('/update')
export class UpdateController {
  @Get()
  async check(@Query() payload, @Context() c) {
    const downloader = await updateService.check(payload);

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
