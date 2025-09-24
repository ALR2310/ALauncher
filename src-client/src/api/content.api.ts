import { ContentQueryDto, ContentResponseDto, DetailContentResponseDto } from '@shared/dtos/content.dto';

import api from '~/configs/axios';

export const findAllContent = async (query: ContentQueryDto) => {
  const res = await api.get('contents', { params: query });
  return res.data as ContentResponseDto;
};

export const findOneContent = async (contentId: number) => {
  const res = await api.get(`contents/${contentId}`);
  return res.data as DetailContentResponseDto;
};
