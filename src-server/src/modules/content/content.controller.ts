import {
  ContentDetailQueryDto,
  ContentFileQueryDto,
  ContentFilesQueryDto,
  ContentQueryDto,
} from '@shared/dtos/content.dto';

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
  @Validate(ContentFilesQueryDto)
  async findFiles(@Param('id') id, @Query() query) {
    const payload: ContentFilesQueryDto = { id, ...query };
    return contentService.findFiles(payload);
  }

  @Get(':id/files/:fileId')
  @Validate(ContentFileQueryDto)
  async findFile(@Param() params: ContentFileQueryDto) {
    return contentService.findFile(params);
  }
}
