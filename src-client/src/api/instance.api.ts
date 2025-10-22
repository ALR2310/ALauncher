import { ContentResponseDto } from '@shared/dtos/content.dto';
import {
  InstanceContentAddQueryDto,
  InstanceContentQueryDto,
  InstanceContentRemoveQueryDto,
  InstanceContentRemoveResponseDto,
  InstanceContentToggleQueryDto,
  InstanceDto,
  InstanceQueryDto,
  InstanceWorldDto,
} from '@shared/dtos/instance.dto';

import { API, API_URL } from '.';

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

export async function instanceUpdate(body: Partial<InstanceDto>) {
  return API.put<InstanceDto>(`${BASE_PATH}/${body.id}`, body);
}

export async function instanceDelete(id: string) {
  return API.delete<InstanceDto>(`${BASE_PATH}/${id}`);
}

export async function instanceFindWorlds(id: string) {
  return API.get<InstanceWorldDto[]>(`${BASE_PATH}/${id}/worlds`);
}

export function instanceLaunch(id: string) {
  const url = `${API_URL}/${BASE_PATH}/${id}/launch`;
  return new EventSource(url);
}

export async function instanceCancel(id: string) {
  return API.get(`${BASE_PATH}/${id}/cancel`);
}

export async function instanceDownload(id: string) {
  const url = `${API_URL}/${BASE_PATH}/${id}/download`;
  return new EventSource(url);
}

export async function instanceGetContents(params: InstanceContentQueryDto) {
  const { id, contentType } = params;
  return API.get<ContentResponseDto>(`${BASE_PATH}/${id}/${contentType}`);
}

export function instanceAddContent(params: InstanceContentAddQueryDto) {
  const { id, contentType, contentId, worlds } = params;
  const url = `${API_URL}/${BASE_PATH}/${id}/${contentType}/${contentId}?worlds=${worlds || ''}`;
  return new EventSource(url);
}

export async function instanceRemoveContent(params: InstanceContentRemoveQueryDto) {
  const { id, contentType, contentId } = params;
  return API.delete<InstanceContentRemoveResponseDto>(`${BASE_PATH}/${id}/${contentType}/${contentId}`);
}

export async function instanceToggleContent(params: InstanceContentToggleQueryDto) {
  const { id, contentType, ...rest } = params;
  return API.put<ContentResponseDto>(`${BASE_PATH}/${id}/${contentType}`, rest);
}
