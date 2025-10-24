import {
  ContentDetailQueryDto,
  ContentDto,
  ContentFileQueryDto,
  ContentFileResponseDto,
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

export const contentFindFiles = async (params: ContentFileQueryDto) => {
  const { id, ...rest } = params;
  return API.get<ContentFileResponseDto>(`${BASE_PATH}/${id}/files`, rest);
};
