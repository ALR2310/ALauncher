import {
  InstanceContentAddQueryDto,
  InstanceContentQueryDto,
  InstanceDto,
  InstanceQueryDto,
} from '@shared/dtos/instance.dto';

import { Body, Controller, Delete, Get, Param, Post, Put, Query, Validate } from '~/common/decorators';

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

  @Get(':id/:contentType')
  @Validate(InstanceContentQueryDto)
  async getContents(@Param() param) {
    return instanceService.getContents(param);
  }

  @Get(':id/:contentType/:contentId')
  @Validate(InstanceContentAddQueryDto)
  async addContents(@Param() param) {
    return instanceService.addContents(param);
  }

  @Delete(':id/:contentType/:contentId')
  async removeContents() {}

  @Put(':id/:contentType')
  async toggleContents() {}
}
