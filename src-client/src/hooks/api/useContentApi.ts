import { ContentDetailQueryDto, ContentFilesQueryDto, ContentQueryDto } from '@shared/dtos/content.dto';
import { useInfiniteQuery, useQueries, useQuery } from '@tanstack/react-query';

import { contentFindAll, contentFindFiles, contentFindOne } from '~/api/content.api';

export function useContentsQuery(params: ContentQueryDto) {
  return useQuery({
    queryKey: ['contents', params],
    queryFn: () => contentFindAll(params),
    staleTime: 0,
  });
}

export function useContentsQueries(paramsList: ContentQueryDto[]) {
  return useQueries({
    queries: paramsList.map((params) => ({
      queryKey: ['contents', params],
      queryFn: () => contentFindAll(params),
      staleTime: 0,
    })),
  });
}

export function useContentsInfinite(params: ContentQueryDto) {
  return useInfiniteQuery({
    queryKey: ['contents', params],
    queryFn: ({ pageParam }) => contentFindAll({ ...params, index: pageParam }),
    getNextPageParam: (lastPage) => {
      const { index, pageSize, totalCount } = lastPage.pagination;
      const nextIndex = index + pageSize;
      if (nextIndex < totalCount) return nextIndex;
      return undefined;
    },
    initialPageParam: 0,
  });
}

export function useContentDetailQuery(params: ContentDetailQueryDto) {
  const { slug, instance } = params;
  return useQuery({
    queryKey: ['contentDetail', slug, instance],
    queryFn: () => contentFindOne(params),
    enabled: !!slug,
  });
}

export function useContentFilesInfinite(params: ContentFilesQueryDto) {
  return useInfiniteQuery({
    queryKey: ['contentFiles', params],
    queryFn: ({ pageParam }) => contentFindFiles({ ...params, index: pageParam }),
    getNextPageParam: (lastPage) => {
      const { index, pageSize, totalCount } = lastPage.pagination;
      const nextIndex = index + pageSize;
      if (nextIndex < totalCount) return nextIndex;
      return undefined;
    },
    enabled: !!params.id,
    staleTime: 0,
    initialPageParam: 0,
  });
}
