import {
  InstanceContentAddQueryDto,
  InstanceContentQueryDto,
  InstanceContentRemoveQueryDto,
  InstanceContentToggleQueryDto,
  InstanceDto,
  InstanceQueryDto,
} from '@shared/dtos/instance.dto';
import { streamSSE } from 'hono/streaming';

import { Body, Context, Controller, Delete, Get, Param, Post, Put, Query, Validate } from '~/common/decorators';

import { instanceService } from './instance.service';

@Controller('instances')
export class InstanceController {
  @Get()
  @Validate(InstanceQueryDto)
  async findAll(@Query() query: InstanceQueryDto) {
    return instanceService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return instanceService.findOne(id);
  }

  @Post()
  @Validate(InstanceDto)
  async create(@Body() body: InstanceDto) {
    return instanceService.create(body);
  }

  @Put(':id')
  @Validate(InstanceDto)
  async update(@Body() body: InstanceDto, @Param('id') id: string) {
    return instanceService.update({ ...body, id });
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return instanceService.delete(id);
  }

  @Get(':id/worlds')
  async getWorlds(@Param('id') id: string) {
    return instanceService.getWorlds(id);
  }

  @Get(':id/folders')
  async openFolder(@Param('id') id: string) {
    return instanceService.openFolder(id);
  }

  @Get(':id/launch')
  async launch(@Param('id') id: string, @Context() c) {
    const launcher = await instanceService.launch(id);

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

  @Get(':id/cancel')
  async cancel(@Param('id') id: string) {
    return instanceService.cancel(id);
  }

  @Get(':id/verify')
  async verify(@Param('id') id: string, @Context() c) {
    const verifier = await instanceService.verify(id);
    if (!verifier) {
      return streamSSE(c, async (stream) => {
        await stream.writeSSE({ event: 'done', data: 'Verification complete' });
        await stream.close();
      });
    }

    return streamSSE(c, async (stream) => {
      const done = new Promise<void>((resolve) => {
        verifier
          .on('progress', async (percent) => await stream.writeSSE({ event: 'progress', data: percent }))
          .on('speed', async (s) => await stream.writeSSE({ event: 'speed', data: s }))
          .on('estimated', async (e) => await stream.writeSSE({ event: 'estimated', data: e }))
          .on('extract', async (f) => await stream.writeSSE({ event: 'extract', data: f }))
          .on('done', async () => {
            await stream.writeSSE({ event: 'done', data: 'Download complete' });
            await stream.close();
            resolve();
          })
          .on('error', async (err) => {
            await stream.writeSSE({ event: 'error', data: JSON.stringify(err) });
            await stream.close();
            resolve();
          });
      });

      await done;
    });
  }

  @Get(':id/:contentType')
  @Validate(InstanceContentQueryDto)
  async getContents(@Param() param) {
    return instanceService.getContents(param);
  }

  @Get(':id/:contentType/:contentId')
  @Validate(InstanceContentAddQueryDto)
  async addContents(@Param() param, @Query() query, @Context() c) {
    const payload: InstanceContentAddQueryDto = { ...param, ...query };
    const downloader = await instanceService.addContents(payload);

    if (!downloader) {
      return streamSSE(c, async (stream) => {
        await stream.writeSSE({ event: 'done', data: 'Already installed' });
        await stream.close();
      });
    }

    return streamSSE(c, async (stream) => {
      const done = new Promise<void>((resolve) => {
        downloader
          .on('progress', async (percent) => await stream.writeSSE({ event: 'progress', data: percent }))
          .on('speed', async (s) => await stream.writeSSE({ event: 'speed', data: s }))
          .on('estimated', async (e) => await stream.writeSSE({ event: 'estimated', data: e }))
          .on('extract', async (f) => await stream.writeSSE({ event: 'extract', data: f }))
          .on('done', async () => {
            await stream.writeSSE({ event: 'done', data: 'Download complete' });
            await stream.close();
            resolve();
          })
          .on('error', async (err) => {
            await stream.writeSSE({ event: 'error', data: JSON.stringify(err) });
            await stream.close();
            resolve();
          });
      });

      await done;
    });
  }

  @Delete(':id/:contentType')
  @Validate(InstanceContentRemoveQueryDto)
  async removeContents(@Param() param, @Query() query) {
    const payload: InstanceContentRemoveQueryDto = { ...param, ...query };
    return instanceService.removeContents(payload);
  }

  @Put(':id/:contentType')
  @Validate(InstanceContentToggleQueryDto)
  async toggleContents(@Param() param, @Body() body) {
    const payload: InstanceContentToggleQueryDto = { ...param, ...body };
    return instanceService.toggleContents(payload);
  }
}
