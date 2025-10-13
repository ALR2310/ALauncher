import { AppConfigDto, SetConfigDto } from '@shared/dtos/app.dto';

import { API, API_URL } from '.';

const BASE_URL = 'app';

export async function appStatus() {
  return API.get(`${BASE_URL}/status`);
}

export async function appVersion() {
  return API.get(`${BASE_URL}/version`);
}

export async function appExit() {
  return API.get(`${BASE_URL}/exit`);
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

export async function appCheckForUpdates(): Promise<{
  hasUpdate: boolean;
  assets: any[];
}> {
  return API.get(`${BASE_URL}/update/check`);
}

export async function appInstallUpdates() {
  const apiPath = `${API_URL}${BASE_URL}/update/install`;
  return new EventSource(apiPath);
}
