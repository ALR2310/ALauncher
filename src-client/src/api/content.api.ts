import {
  ContentDetailQueryDto,
  ContentDto,
  ContentFileDto,
  ContentFileQueryDto,
  ContentFilesQueryDto,
  ContentFilesResponseDto,
  ContentQueryDto,
  ContentResponseDto,
} from '@shared/dtos/content.dto';

import { API } from '.';

const BASE_PATH = 'contents';

export const contentFindAll = async (params: ContentQueryDto) => {
  return API.get<ContentResponseDto>(`${BASE_PATH}`, params);
};

export const contentFindOne = async (params: ContentDetailQueryDto) => {
  const { slug, ...rest } = params;
  return API.get<ContentDto>(`${BASE_PATH}/${slug}`, rest);
};

export const contentFindFile = async (params: ContentFileQueryDto) => {
  const { id, fileId } = params;
  return API.get<ContentFileDto>(`${BASE_PATH}/${id}/files/${fileId}`);
};

export const contentFindFiles = async (params: ContentFilesQueryDto) => {
  const { id, ...rest } = params;
  return API.get<ContentFilesResponseDto>(`${BASE_PATH}/${id}/files`, rest);
};
