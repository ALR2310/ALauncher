import { LoaderDto } from '@shared/dtos/version.dto';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { findAllVersion, findLoaderVersion, findReleaseNotes, findReleaseVersion } from '~/api/version.api';

export function useFindAllVersionQuery() {
  return useQuery({
    queryKey: ['versions'],
    queryFn: findAllVersion,
  });
}

export function useFindReleaseVersionQuery() {
  return useQuery({
    queryKey: ['release-version'],
    queryFn: findReleaseVersion,
  });
}

export function useFindLoaderVersionQuery(params: LoaderDto) {
  return useQuery({
    queryKey: ['loader-version', params],
    queryFn: () => findLoaderVersion(params),
  });
}

export function useFindReleaseNoteInfinite() {
  return useInfiniteQuery({
    queryKey: ['release-note'],
    queryFn: ({ pageParam = 1 }) => findReleaseNotes({ pageIndex: pageParam, pageSize: 2 }),
    getNextPageParam: (_lastPage, allPages) => allPages.length + 1,
    initialPageParam: 1,
  });
}
