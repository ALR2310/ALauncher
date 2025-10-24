import { LoaderQueryDto, ReleaseNoteQueryDto } from '@shared/dtos/version.dto';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { versionLoaders, versionNoteDetail, versionNotes, versionReleases } from '~/api/version.api';

export const useVersionReleasesQuery = () => {
  return useQuery({
    queryKey: ['versionReleases'],
    queryFn: () => versionReleases(),
  });
};

export const useVersionLoadersQuery = (params: LoaderQueryDto) => {
  return useQuery({
    queryKey: ['versionLoaders', params],
    queryFn: () => versionLoaders(params),
    enabled: !!params.version,
  });
};

export const useVersionNotesQuery = (payload: ReleaseNoteQueryDto) => {
  return useQuery({
    queryKey: ['versionNotes', payload],
    queryFn: () => versionNotes(payload),
  });
};

export const useVersionNotesInfinite = (payload: ReleaseNoteQueryDto) => {
  return useInfiniteQuery({
    queryKey: ['versionNotesInfinite', payload],
    queryFn: ({ pageParam = 0 }) => versionNotes({ ...payload, index: pageParam }),
    getNextPageParam: (lastPage) => {
      const { index, pageSize, totalCount } = lastPage.pagination;
      const nextIndex = index + pageSize;
      if (nextIndex < totalCount) return nextIndex;
      return undefined;
    },
    staleTime: 0,
    initialPageParam: 0,
  });
};

export const useVersionNoteDetailQuery = (version: string) => {
  return useQuery({
    queryKey: ['versionNoteDetail', version],
    queryFn: () => versionNoteDetail(version),
  });
};
