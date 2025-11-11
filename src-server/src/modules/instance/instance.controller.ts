import {
  InstanceContentAddQueryDto,
  InstanceContentDownloadQueryDto,
  InstanceContentQueryDto,
  InstanceContentRemoveQueryDto,
  InstanceContentToggleQueryDto,
  InstanceDto,
  InstanceQueryDto,
  InstanceUpdateBodyDto,
  InstanceUploadQueryDto,
} from '@shared/dtos/instance.dto';
import EventEmitter from 'events';
import { Context as HonoContext } from 'hono';
import { streamSSE } from 'hono/streaming';

import { Body, Context, Controller, Delete, Get, Param, Post, Put, Query, Validate } from '~/common/decorators';

import { instanceService } from './instance.service';
import { instanceCloudService } from './instance-cloud.service';
import { instanceContentService } from './instance-content.service';
import { instanceFolderService } from './instance-folder.service';
import { instanceLaunchService } from './instance-launch.service';

export async function handleDownloaderSSE(
  c: HonoContext,
  event: EventEmitter | null | undefined,
  noContentMsg = 'No contents to process',
) {
  if (!event) {
    return streamSSE(c, async (stream) => {
      await stream.writeSSE({ event: 'done', data: noContentMsg });
      await stream.close();
    });
  }

  return streamSSE(c, async (stream) => {
    const done = new Promise<void>((resolve) => {
      event
        .on('progress', async (p) => await stream.writeSSE({ event: 'progress', data: p }))
        .on('log', async (l) => await stream.writeSSE({ event: 'log', data: l })) // For Launcher
        .on('speed', async (s) => await stream.writeSSE({ event: 'speed', data: s }))
        .on('estimated', async (e) => await stream.writeSSE({ event: 'estimated', data: e }))
        .on('extract', async (f) => await stream.writeSSE({ event: 'extract', data: f }))
        .on('patch', async (p) => await stream.writeSSE({ event: 'patch', data: p }))
        .on('done', async () => {
          await stream.writeSSE({ event: 'done', data: 'Download complete' });
          await stream.close();
          resolve();
        })
        .on('cancelled', async () => {
          await stream.writeSSE({ event: 'cancelled', data: 'Launch cancelled' });
          await stream.close();
          resolve();
        }) // For Launcher
        .on('close', async () => {
          await stream.writeSSE({ event: 'close', data: 'Launch closed' });
          await stream.close();
          resolve();
        }) // For Launcher
        .on('error', async (err) => {
          await stream.writeSSE({ event: 'error', data: JSON.stringify(err) });
          await stream.close();
          resolve();
        });
    });

    await done;
  });
}

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
  @Validate(InstanceUpdateBodyDto)
  async update(@Body('data') body: Partial<InstanceDto>, @Param('id') id: string) {
    return instanceService.update(id, body);
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
    return instanceFolderService.openFolder(id);
  }

  @Get(':id/folders/tree')
  async getFolderTree(@Param('id') id: string) {
    return instanceFolderService.getFolderTree(id);
  }

  @Get(':id/launch')
  async launch(@Param('id') id: string, @Context() c) {
    try {
      const event = await instanceLaunchService.launch(id);
      return handleDownloaderSSE(c, event, 'No launch actions to perform');
    } catch (err: any) {
      return streamSSE(c, async (stream) => {
        await stream.writeSSE({ event: 'error', data: err.message });
        await stream.close();
      });
    }
  }

  @Get(':id/cancel')
  async cancel(@Param('id') id: string) {
    return instanceLaunchService.cancel(id);
  }

  @Get(':id/contents')
  @Validate(InstanceContentQueryDto)
  async getContents(@Param('id') id: string, @Query() query) {
    const payload: InstanceContentQueryDto = { ...query, id };
    return instanceContentService.getContents(payload);
  }

  @Post(':id/contents')
  @Validate(InstanceContentAddQueryDto)
  async addContents(@Param('id') id: string, @Body() body, @Context() c) {
    const payload: InstanceContentAddQueryDto = { ...body, id };

    try {
      const event = await instanceContentService.addContents(payload);
      return handleDownloaderSSE(c, event, 'No contents to add');
    } catch (err: any) {
      return streamSSE(c, async (stream) => {
        await stream.writeSSE({ event: 'error', data: err.message });
        await stream.close();
      });
    }
  }

  @Delete(':id/contents')
  @Validate(InstanceContentRemoveQueryDto)
  async removeContents(@Param('id') id: string, @Query() query) {
    const payload: InstanceContentRemoveQueryDto = { ...query, id };
    return instanceContentService.removeContents(payload);
  }

  @Put(':id/contents/toggle')
  @Validate(InstanceContentToggleQueryDto)
  async toggleContents(@Param('id') id: string, @Body() body) {
    const payload: InstanceContentToggleQueryDto = { ...body, id };
    return instanceContentService.toggleContents(payload);
  }

  @Get(':id/contents/check')
  async checkContents() {}

  @Post(':id/contents/download')
  @Validate(InstanceContentDownloadQueryDto)
  async downloadContents(@Param('id') id: string, @Body() body, @Context() c) {
    const payload: InstanceContentDownloadQueryDto = { ...body, id };

    try {
      const event = await instanceContentService.downloadContents(payload);
      return handleDownloaderSSE(c, event, 'No contents to download');
    } catch (err: any) {
      return streamSSE(c, async (stream) => {
        await stream.writeSSE({ event: 'error', data: err.message || 'Unknown error' });
        await stream.close();
      });
    }
  }

  @Get('cloud')
  async findAllCloud() {
    return instanceCloudService.findAll();
  }

  @Get('cloud/:id')
  async findOneCloud(@Param('id') id: string) {
    return instanceCloudService.findOne(id);
  }

  @Post('cloud/:id/upload')
  @Validate(InstanceUploadQueryDto)
  async uploadCloud(@Param('id') id: string, @Body() body) {
    const payload: InstanceUploadQueryDto = { id, ...body };
    return instanceCloudService.upload(payload);
  }

  @Get('cloud/:id/download')
  async downloadCloud(@Param('id') id: string) {
    return instanceCloudService.download(id);
  }

  @Get('cloud/:id/sync')
  async syncCloud(@Param('id') id: string) {
    return instanceCloudService.sync(id);
  }

  @Delete('cloud/:id/delete')
  async deleteCloud(@Param('id') id: string) {
    return instanceCloudService.delete(id);
  }
}
