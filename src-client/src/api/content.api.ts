import { ContentQueryDto, ContentResponseDto, DetailContentResponseDto } from '@shared/dtos/content.dto';

import { API } from '~/api/api';

const BASE_PATH = '/contents';

export const findAllContent = async (params: ContentQueryDto) => {
  return API.get<ContentResponseDto>(`${BASE_PATH}`, params);
};

export const findOneContent = async (contentId: number) => {
  return API.get<DetailContentResponseDto>(`${BASE_PATH}/${contentId}`);
};
