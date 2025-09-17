import { ContentQueryDto } from '@shared/dtos/content.dto';

import { Controller, Get, Query, Validate } from '~/common/decorators';

import { contentService } from './content.service';

@Controller('/contents')
export class ContentController {
  @Get()
  @Validate(ContentQueryDto)
  async findAll(@Query() query: ContentQueryDto) {
    return contentService.findAll(query);
  }
}
