import {
  AppConfigDto,
  AppSystemInfoDto,
  AppVersionDto,
  CheckUpdateResponseDto,
  SetConfigDto,
} from '@shared/dtos/app.dto';

import { API } from '.';

const BASE_URL = 'app';

export async function appStatus() {
  return API.get(`${BASE_URL}/status`);
}

export async function appVersion() {
  return API.get<AppVersionDto>(`${BASE_URL}/version`);
}

export async function appExit() {
  return API.get(`${BASE_URL}/exit`);
}

export async function getSystemInfo() {
  return API.get<AppSystemInfoDto>(`${BASE_URL}/system-info`);
}

export async function appGetConfig() {
  return API.get<AppConfigDto>(`${BASE_URL}/config`);
}

export async function appSetConfig(payload: SetConfigDto) {
  return API.put<AppConfigDto>(`${BASE_URL}/config`, payload);
}

export async function appOpenFolder() {
  return API.get(`${BASE_URL}/open-folder`);
}

export async function appCheckForUpdates() {
  return API.get<CheckUpdateResponseDto>(`${BASE_URL}/update/check`);
}

export async function appInstallUpdates() {
  return API.getSSE(`${BASE_URL}/update/install`);
}
