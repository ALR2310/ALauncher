import { AdditionalQuery, AdditionalResponse } from '@shared/schema/additional.schema';
import { useInfiniteQuery } from '@tanstack/react-query';

import api from '~/configs/axios';

export const useLauncherAdditional = () => {
  const getAdditionalQuery = (query: AdditionalQuery) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useInfiniteQuery({
      queryKey: ['additionalQuery', query],
      queryFn: async ({ pageParam = 0 }) => {
        const res = await api.get('additional', { params: { ...query, index: pageParam } });
        return res.data as AdditionalResponse;
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

  return { getAdditionalQuery };
};
