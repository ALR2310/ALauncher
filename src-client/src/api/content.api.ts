import {
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

export const contentFindFiles = async (params: ContentFileQueryDto) => {
  const { id, ...rest } = params;
  return API.get<ContentFileResponseDto>(`${BASE_PATH}/${id}/files`, rest);
};
