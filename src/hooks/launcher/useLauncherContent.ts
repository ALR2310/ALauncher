import { ContentQueryDto, ContentResponseDto } from '@shared/dtos/content.dto';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import api from '~/configs/axios';

export const useLauncherContent = () => {
  const findAllContentQuery = (query: ContentQueryDto) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useInfiniteQuery({
      queryKey: ['contentsQuery', query],
      queryFn: async ({ pageParam = 0 }) => {
        const res = await api.get('contents', { params: { ...query, index: pageParam } });
        return res.data as ContentResponseDto;
      },
      getNextPageParam: (lastPage, _allPages, lastPageParam) => {
        const nextPageIndex = lastPageParam + 1;
        const total = lastPage.pagination.totalCount;
        if (nextPageIndex * lastPage.pagination.pageSize < total) {
          return nextPageIndex;
        }
        return undefined;
      },

      initialPageParam: 0,
    });
  };

  const findContentsByIdsQuery = (ids: number[]) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useQuery({
      queryKey: ['contentsByIdsQuery', ids],
      queryFn: async () => {
        const res = await api.get('contents', { params: { ids: ids.join(',') } });
        return res.data as ContentResponseDto;
      },
      enabled: ids.length > 0,
    });
  };

  return { findAllContentQuery, findContentsByIdsQuery };
};
