import { ContentQueryDto } from '@shared/dtos/content.dto';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { findAllContent, findOneContent } from '~/api/content.api';

export const useLauncherContent = () => {
  const findAllContentQuery = (query: ContentQueryDto) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useInfiniteQuery({
      queryKey: ['contentsQuery', query],
      queryFn: async ({ pageParam = 0 }) => findAllContent({ ...query, index: pageParam }),
      getNextPageParam: (lastPage, _allPages, lastPageParam) => {
        const nextPageIndex = lastPageParam + 1;
        const total = lastPage.pagination.totalCount;
        if (nextPageIndex * lastPage.pagination.pageSize < total) return nextPageIndex;
        return undefined;
      },
      staleTime: 0,
      initialPageParam: 0,
    });
  };

  const findOneContentQuery = (contentId: number) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useQuery({
      queryKey: ['content', contentId],
      queryFn: async () => findOneContent(contentId),
      enabled: !!contentId,
    });
  };

  return { findAllContentQuery, findOneContentQuery };
};
