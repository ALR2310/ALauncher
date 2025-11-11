import { BaseResponseDto } from '@shared/dtos/base.dto';
import { ContentResponseDto } from '@shared/dtos/content.dto';
import {
  InstanceCloudDownloadResponseDto,
  InstanceCloudDto,
  InstanceCloudUploadQueryDto,
  InstanceCloudUploadResponseDto,
  InstanceContentAddQueryDto,
  InstanceContentDownloadQueryDto,
  InstanceContentQueryDto,
  InstanceContentRemoveQueryDto,
  InstanceContentRemoveResponseDto,
  InstanceContentToggleQueryDto,
  InstanceDto,
  InstanceFolderTreeDto,
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

export async function instanceGetFolderTree(id: string) {
  return API.get<InstanceFolderTreeDto>(`${BASE_PATH}/${id}/folders/tree`);
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

export async function instanceCloudFindAll() {
  return API.get<InstanceCloudDto[]>(`${BASE_PATH}/cloud`);
}

export async function instanceCloudFindOne(id: string) {
  return API.get<InstanceCloudDto>(`${BASE_PATH}/cloud/${id}`);
}

export async function instanceCloudUpload(params: InstanceCloudUploadQueryDto) {
  const { id, ...rest } = params;
  return API.post<InstanceCloudUploadResponseDto>(`${BASE_PATH}/cloud/${id}/upload`, rest);
}

export async function instanceCloudDownload(id: string) {
  return API.get<InstanceCloudDownloadResponseDto>(`${BASE_PATH}/cloud/${id}/download`);
}

export async function instanceCloudSync(id: string) {
  return API.get<BaseResponseDto>(`${BASE_PATH}/cloud/${id}/sync`);
}

export async function instanceCloudDelete(id: string) {
  return API.delete<BaseResponseDto>(`${BASE_PATH}/cloud/${id}/delete`);
}
