import { ContentResponseDto } from '@shared/dtos/content.dto';
import {
  InstanceContentAddQueryDto,
  InstanceContentDownloadQueryDto,
  InstanceContentQueryDto,
  InstanceContentRemoveQueryDto,
  InstanceContentRemoveResponseDto,
  InstanceContentToggleQueryDto,
  InstanceDto,
  InstanceQueryDto,
  InstanceUpdateBodyDto,
  InstanceWorldDto,
} from '@shared/dtos/instance.dto';

import { API } from '.';

const BASE_PATH = 'instances';

export async function instanceFindAll(param?: InstanceQueryDto) {
  return API.get<InstanceDto[]>(`${BASE_PATH}`, param);
}

export async function instanceFindOne(id: string) {
  return API.get<InstanceDto>(`${BASE_PATH}/${id}`);
}

export async function instanceCreate(body: InstanceDto) {
  return API.post<InstanceDto>(`${BASE_PATH}`, body);
}

export async function instanceUpdate(payload: InstanceUpdateBodyDto) {
  const { id, ...rest } = payload;
  return API.put<InstanceDto>(`${BASE_PATH}/${id}`, rest);
}

export async function instanceDelete(id: string) {
  return API.delete<InstanceDto>(`${BASE_PATH}/${id}`);
}

export async function instanceFindWorlds(id: string) {
  return API.get<InstanceWorldDto[]>(`${BASE_PATH}/${id}/worlds`);
}

export async function instanceOpenFolder(id: string) {
  return API.get(`${BASE_PATH}/${id}/folders`);
}

export function instanceLaunch(id: string) {
  return API.getSSE(`${BASE_PATH}/${id}/launch`);
}

export async function instanceCancel(id: string) {
  return API.get(`${BASE_PATH}/${id}/cancel`);
}

export async function instanceGetContents(params: InstanceContentQueryDto) {
  const { id, ...rest } = params;
  return API.get<ContentResponseDto>(`${BASE_PATH}/${id}/contents`, rest);
}

export function instanceAddContent(params: InstanceContentAddQueryDto) {
  const { id, ...rest } = params;
  return API.postSSE(`${BASE_PATH}/${id}/contents`, rest);
}

export async function instanceRemoveContent(params: InstanceContentRemoveQueryDto) {
  const { id, ...rest } = params;
  return API.delete<InstanceContentRemoveResponseDto>(`${BASE_PATH}/${id}/contents`, rest);
}

export async function instanceToggleContent(params: InstanceContentToggleQueryDto) {
  const { id, ...rest } = params;
  return API.put<ContentResponseDto>(`${BASE_PATH}/${id}/contents/toggle`, rest);
}

export async function instanceDownloadContent(params: InstanceContentDownloadQueryDto) {
  const { id, ...rest } = params;
  return API.postSSE(`${BASE_PATH}/${id}/contents/download`, rest);
}
