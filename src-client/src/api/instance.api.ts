import { ContentResponseDto } from '@shared/dtos/content.dto';
import { InstanceDto, RemoveContentInstanceDto, ToggleContentInstanceDto } from '@shared/dtos/instance.dto';

import api from '~/configs/axios';

const BASE_PATH = '/instances';

export const findAllInstance = async () => {
  const res = await api.get(BASE_PATH);
  return res.data as InstanceDto[];
};

export const findOneInstance = async (id: string) => {
  const res = await api.get(`${BASE_PATH}/${id}`);
  return res.data as InstanceDto;
};

export const createInstance = async (instance: InstanceDto) => {
  const res = await api.post(`${BASE_PATH}`, instance);
  return res.data as InstanceDto;
};

export const updateInstance = async (instance: InstanceDto) => {
  const res = await api.put(`${BASE_PATH}/${instance.id}`, instance);
  return res.data as InstanceDto;
};

export const deleteInstance = async (id: string) => {
  const res = await api.delete(`${BASE_PATH}/${id}`);
  return res.data as InstanceDto;
};

export const findContentInstance = async (instanceId: string, type: string) => {
  const res = await api.get(`${BASE_PATH}/${instanceId}/${type}`);
  return res.data as ContentResponseDto;
};

export const removeContentInstance = async ({ id, type, contentId }: RemoveContentInstanceDto) => {
  const res = await api.delete(`${BASE_PATH}/${id}/${type}/${contentId}`);
  return res.data as InstanceDto;
};

export const canRemoveContentInstance = async ({ id, type, contentId }: RemoveContentInstanceDto) => {
  const res = await api.get(`${BASE_PATH}/${id}/${type}/${contentId}/can-remove`);
  return res.data as { canRemove: boolean; message: string; dependents: string[] };
};

export const toggleContentInstance = async ({ id, type, contentIds, enabled }: ToggleContentInstanceDto) => {
  const res = await api.post(`${BASE_PATH}/${id}/${type}/toggle`, { contentIds, enabled });
  return res.data as InstanceDto;
};
