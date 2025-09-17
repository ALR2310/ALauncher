import { ContentQueryDto, ContentResponseDto } from '@shared/dtos/content.dto';
import { useInfiniteQuery } from '@tanstack/react-query';

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
      staleTime: 0,
      initialPageParam: 0,
    });
  };

  return { findAllContentQuery };
};
