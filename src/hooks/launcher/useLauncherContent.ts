import { ContentQuery, ContentResponse } from '@shared/schemas/content.schema';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import api from '~/configs/axios';

export const useLauncherContent = () => {
  const getContentsQuery = (query: ContentQuery) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useInfiniteQuery({
      queryKey: ['contentsQuery', query],
      queryFn: async ({ pageParam = 0 }) => {
        const res = await api.get('content', { params: { ...query, index: pageParam } });
        return res.data as ContentResponse;
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

  const getContentByIdsQuery = (ids: number[]) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useQuery({
      queryKey: ['contentsByIdsQuery', ids],
      queryFn: async () => {
        const res = await api.get('content', { params: { ids: ids.join(',') } });
        return res.data as ContentResponse;
      },
      enabled: ids.length > 0,
    });
  };

  return { getContentsQuery, getContentByIdsQuery };
};
