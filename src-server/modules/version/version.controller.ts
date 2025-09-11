import { LoaderDto, ReleaseNoteQueryDto } from '@shared/dtos/version.dto';

import { Controller, Get, Query, Validate } from '~s/common/decorators';

import { versionService } from './version.service';

@Controller('/versions')
export class VersionController {
  @Get()
  async findAll() {
    return versionService.findAll();
  }

  @Get('/releases')
  async findReleases() {
    return versionService.findReleases();
  }

  @Get('/releases/notes')
  @Validate(ReleaseNoteQueryDto)
  async findReleaseNotes(@Query() query: ReleaseNoteQueryDto) {
    return versionService.findReleaseNotes(query);
  }

  @Get('/loaders')
  @Validate(LoaderDto)
  async findLoaders(@Query() query: LoaderDto) {
    return versionService.findLoaders(query);
  }
}
