import { ContentResponseDto } from '@shared/dtos/content.dto';
import {
  AddContentInstanceDto,
  InstanceDto,
  RemoveContentInstanceDto,
  ToggleContentInstanceDto,
} from '@shared/dtos/instance.dto';
import qs from 'qs';

import { API, API_URL } from '~/api/api';

const BASE_PATH = 'instances';

export const findAllInstance = async () => {
  return API.get<InstanceDto[]>(BASE_PATH);
};

export const findOneInstance = async (id: string) => {
  return API.get<InstanceDto>(`${BASE_PATH}/${id}`);
};

export const createInstance = async (instance: InstanceDto) => {
  return API.post<InstanceDto>(`${BASE_PATH}`, instance);
};

export const updateInstance = async (instance: InstanceDto) => {
  return API.put<InstanceDto>(`${BASE_PATH}/${instance.id}`, instance);
};

export const deleteInstance = async (id: string) => {
  return API.delete<InstanceDto>(`${BASE_PATH}/${id}`);
};

export const findContentInstance = async (instanceId: string, type: string) => {
  return API.get<ContentResponseDto>(`${BASE_PATH}/${instanceId}/${type}`);
};

export const addContentInstance = (params: AddContentInstanceDto) => {
  const { id: instanceId, type: contentType, contentId, worlds } = params;
  const query = qs.stringify({ worlds }, { arrayFormat: 'repeat' });
  const apiPath = `${API_URL}/${BASE_PATH}/${instanceId}/${contentType}/${contentId}?${query}`;
  return new EventSource(apiPath);
};

export const removeContentInstance = async ({ id, type, contentId }: RemoveContentInstanceDto) => {
  return API.delete<InstanceDto>(`${BASE_PATH}/${id}/${type}/${contentId}`);
};

export const canRemoveContentInstance = async ({ id, type, contentId }: RemoveContentInstanceDto) => {
  return API.get<{ canRemove: boolean; message: string; dependents: string[] }>(
    `${BASE_PATH}/${id}/${type}/${contentId}/can-remove`,
  );
};

export const toggleContentInstance = async ({ id, type, contentIds, enabled }: ToggleContentInstanceDto) => {
  return API.post(`${BASE_PATH}/${id}/${type}/toggle`, { contentIds, enabled });
};
