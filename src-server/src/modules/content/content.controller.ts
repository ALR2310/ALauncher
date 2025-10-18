import { ContentDetailQueryDto, ContentFileQueryDto, ContentQueryDto } from '@shared/dtos/content.dto';

import { Controller, Get, Param, Query, Validate } from '~/common/decorators';

import { contentService } from './content.service';

@Controller('contents')
export class ContentController {
  @Get()
  @Validate(ContentQueryDto)
  async findAll(@Query() query: ContentQueryDto) {
    return contentService.findAll(query);
  }

  @Get(':slug')
  @Validate(ContentDetailQueryDto)
  async findOne(@Param('slug') slug, @Query() query) {
    return contentService.findOne({ slug, ...query });
  }

  @Get(':id/files')
  @Validate(ContentFileQueryDto)
  async findFiles(@Param('id') id, @Query() query) {
    const payload: ContentFileQueryDto = { id, ...query };
    return contentService.findFiles(payload);
  }
}
