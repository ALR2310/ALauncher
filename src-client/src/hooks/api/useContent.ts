import { ContentQueryDto } from '@shared/dtos/content.dto';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { findAllContent, findOneContent } from '~/api';

export function useFindAllContentInfinite(params: ContentQueryDto) {
  return useInfiniteQuery({
    queryKey: ['contents', params],
    queryFn: ({ pageParam }) => findAllContent({ ...params, index: pageParam }),
    getNextPageParam: (lastPage) => {
      const { index, pageSize, totalCount } = lastPage.pagination;
      const nextIndex = index + pageSize;
      if (nextIndex < totalCount) return nextIndex;
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
