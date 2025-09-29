import { ContentQueryDto, DetailContentQueryDto } from '@shared/dtos/content.dto';

import { Controller, Get, Param, Query, Validate } from '~/common/decorators';

import { contentService } from './content.service';

@Controller('/contents')
export class ContentController {
  @Get()
  @Validate(ContentQueryDto)
  async findAll(@Query() query: ContentQueryDto) {
    return contentService.findAll(query);
  }

  @Get('/:slug')
  @Validate(DetailContentQueryDto)
  async findOne(@Param('slug') slug, @Query() query) {
    const payload = { slug, ...query };
    return contentService.findOne(payload);
  }
}
