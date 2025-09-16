import { WorldsQueryDto } from '@shared/dtos/world.dto';

import { Controller, Get, Query, Validate } from '~s/common/decorators';

import { worldService } from './world.service';

@Controller('/worlds')
export class WorldController {
  @Get()
  @Validate(WorldsQueryDto)
  async findAll(@Query() payload: WorldsQueryDto) {
    return worldService.findAll(payload);
  }
}
