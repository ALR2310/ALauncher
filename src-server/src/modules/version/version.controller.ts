import { LoaderQueryDto, ReleaseNoteDetailQueryDto, ReleaseNoteQueryDto } from '@shared/dtos/version.dto';

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
  @Validate(ReleaseNoteQueryDto)
  async findNotes(@Query() query: ReleaseNoteQueryDto) {
    return versionService.findNotes(query);
  }

  @Get('notes/:version')
  @Validate(ReleaseNoteDetailQueryDto)
  async findNoteDetails(@Param() payload: ReleaseNoteDetailQueryDto) {
    return versionService.findNoteDetails(payload);
  }
}
