import { LauncherConfigDto, UpdateLauncherConfigDto } from '@shared/dtos/launcher.dto';

import { API, API_URL } from './api';

const BASE_PATH = 'launchers';

export async function getLauncherConfig() {
  return API.get<LauncherConfigDto>(`${BASE_PATH}/config`);
}

export async function setLauncherConfig(params: UpdateLauncherConfigDto) {
  return API.post<LauncherConfigDto>(`${BASE_PATH}/config`, params);
}

export function openFolder() {
  return API.get(`${BASE_PATH}/folder`);
}

export function launcherLaunch() {
  const apiPath = `${API_URL}/${BASE_PATH}/launch`;
  return new EventSource(apiPath);
}

export function launcherCancel() {
  return API.get(`${BASE_PATH}/cancel`);
}

export function launcherVerify() {
  const apiPath = `${API_URL}/${BASE_PATH}/verify`;
  return new EventSource(apiPath);
}
