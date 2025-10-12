import { ContentFileQueryDto, ContentQueryDto } from '@shared/dtos/content.dto';
import { useInfiniteQuery } from '@tanstack/react-query';

import { contentFindAll, contentFindFiles } from '~/api/content.api';

export function useContentInfinite(params: ContentQueryDto) {
  return useInfiniteQuery({
    queryKey: ['contents', params],
    queryFn: ({ pageParam }) => contentFindAll({ ...params, index: pageParam }),
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

export function useContentFilesInfinite(params: ContentFileQueryDto) {
  return useInfiniteQuery({
    queryKey: ['contentFiles', params],
    queryFn: ({ pageParam }) => contentFindFiles({ ...params, index: pageParam }),
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

