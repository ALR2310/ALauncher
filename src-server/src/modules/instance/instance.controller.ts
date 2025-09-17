import {
  AddContentInstanceDto,
  FindContentsInstanceDto,
  InstanceDto,
  RemoveContentInstanceDto,
  ToggleContentInstanceDto,
  UpdateInstanceDto,
} from '@shared/dtos/instance.dto';
import { streamSSE } from 'hono/streaming';

import {
  Body,
  Context,
  Controller,
  Delete,
  Get,
  Param,
  Payload,
  Post,
  Put,
  Query,
  Validate,
} from '~/common/decorators';

import { instanceService } from './instance.service';

@Controller('/instances')
export class InstanceController {
  @Get()
  async findAll() {
    return await instanceService.findAll();
  }

  @Get('/:id')
  async findOne(@Param('id') id: string) {
    return await instanceService.findOne(id);
  }

  @Post()
  @Validate(InstanceDto)
  async create(@Payload() payload: InstanceDto) {
    return await instanceService.create(payload);
  }

  @Put('/:id')
  @Validate(UpdateInstanceDto)
  async update(@Param('id') id: string, @Body() instance: InstanceDto) {
    const payload: UpdateInstanceDto = { id, instance };
    return await instanceService.update(payload);
  }

  @Delete('/:id')
  async delete(@Param('id') id: string) {
    return await instanceService.delete(id);
  }

  @Get('/:id/:type')
  @Validate(FindContentsInstanceDto)
  async findContents(@Param() payload: FindContentsInstanceDto) {
    return await instanceService.findContents(payload);
  }

  @Get('/:id/:type/:contentId')
  @Validate(AddContentInstanceDto)
  async addContent(@Param() param, @Query() query, @Context() c) {
    const payload: AddContentInstanceDto = { ...param, ...query };
    const downloader = await instanceService.addContent(payload);

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

  @Delete('/:id/:type/:contentId')
  @Validate(RemoveContentInstanceDto)
  async removeContent(@Param() payload: RemoveContentInstanceDto) {
    return await instanceService.removeContent(payload);
  }

  @Get('/:id/:type/:contentId/can-remove')
  @Validate(RemoveContentInstanceDto)
  async canRemoveContent(@Param() payload: RemoveContentInstanceDto) {
    return await instanceService.canRemoveContent(payload);
  }

  @Post('/:id/:type/toggle')
  @Validate(ToggleContentInstanceDto)
  async toggleContent(@Param() param, @Body() body) {
    const payload: ToggleContentInstanceDto = { ...param, ...body };
    return await instanceService.toggleContent(payload);
  }
}
