import {
  AddContentInstanceDto,
  InstanceDto,
  RemoveContentInstanceDto,
  ToggleContentInstanceDto,
  UpdateInstanceDto,
} from '@shared/dtos/instance.dto';
import { streamSSE } from 'hono/streaming';
import throttle from 'lodash/throttle';

import { Body, Context, Controller, Delete, Get, Param, Post, Put, Query, Validate } from '~s/common/decorators';

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
  async create(@Param() payload: InstanceDto) {
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
      const DELAY = 500;
      const done = new Promise<void>((resolve) => {
        downloader
          .on(
            'progress',
            throttle(async (p, s) => {
              const percent = ((p / s) * 100).toFixed(2);

              if (percent === '100.00') {
                await stream.writeSSE({ event: 'done', data: 'Download complete' });
                await stream.close();
                resolve();
              }

              await stream.writeSSE({ event: 'progress', data: percent });
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

  @Delete('/:id/:type/:contentId')
  @Validate(RemoveContentInstanceDto)
  async removeContent(@Param() param, @Query() query) {
    const payload: RemoveContentInstanceDto = { ...param, ...query };
    return await instanceService.removeContent(payload);
  }

  @Get('/:id/:type/:contentId/can-remove')
  @Validate(RemoveContentInstanceDto)
  async canRemoveContent(@Param() param, @Query() query) {
    const payload: RemoveContentInstanceDto = { ...param, ...query };
    return await instanceService.canRemoveContent(payload);
  }

  @Post('/:id/:type/toggle')
  @Validate(ToggleContentInstanceDto)
  async toggleContent(@Param() param, @Body() body) {
    const payload: ToggleContentInstanceDto = { ...param, ...body };
    return await instanceService.toggleContent(payload);
  }
}
