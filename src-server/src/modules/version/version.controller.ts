import { LoaderQueryDto, ReleaseNoteDetailQueryDto } from '@shared/dtos/version.dto';

import { Controller, Get, Param, Query, Validate } from '~/common/decorators';

import { versionService } from './version.service';

@Controller('versions')
export class VersionController {
  @Get('releases')
  async findReleases() {
    return versionService.findReleases();
  }

  @Get('loaders')
  @Validate(LoaderQueryDto)
  async findLoaders(@Query() query: LoaderQueryDto) {
    return versionService.findLoaders(query);
  }

  @Get('notes')
  async findNotes() {
    return versionService.findNotes();
  }

  @Get('notes/:version')
  @Validate(ReleaseNoteDetailQueryDto)
  async findNoteDetails(@Param() payload: ReleaseNoteDetailQueryDto) {
    return versionService.findNoteDetails(payload);
  }
}
