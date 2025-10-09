import { SetConfigDto } from '@shared/dtos/app.dto';

import { Body, Controller, Get, Put, Validate } from '~/common/decorators';

import { appService } from './app.service';

@Controller('app')
export class AppController {
  @Get('status')
  getStatus = () => appService.getStatus();

  @Get('version')
  getVersion = () => appService.getVersion();

  @Get('exit')
  exit = () => appService.exit();

  @Get('config')
  async getConfig() {
    return appService.getConfig();
  }

  @Put('config')
  @Validate(SetConfigDto)
  async setConfig(@Body() body: SetConfigDto) {
    return appService.setConfig(body);
  }

  @Get('open-folder')
  openFolder = () => appService.openFolder();

  @Get('update/check')
  async checkForUpdates() {
    return appService.checkForUpdates();
  }

  @Get('update/install')
  async installUpdates() {
    return appService.installUpdates();
  }
}
