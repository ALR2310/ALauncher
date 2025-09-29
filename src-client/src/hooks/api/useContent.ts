import { ContentQueryDto } from '@shared/dtos/content.dto';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { findAllContent, findOneContent } from '~/api';

export function useFindAllContentInfinite(params: ContentQueryDto) {
  return useInfiniteQuery({
    queryKey: ['contents', params],
    queryFn: ({ pageParam = 0 }) => findAllContent({ ...params, index: pageParam }),
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      const nextPageIndex = lastPageParam + 1;
      const total = lastPage.pagination.totalCount;
      if (nextPageIndex * lastPage.pagination.pageSize < total) return nextPageIndex;
      return undefined;
    },
    staleTime: 0,
    initialPageParam: 0,
  });
}

export function useFindOneContentQuery(slug: string) {
  return useQuery({
    queryKey: ['content', slug],
    queryFn: () => findOneContent(slug),
  });
}
