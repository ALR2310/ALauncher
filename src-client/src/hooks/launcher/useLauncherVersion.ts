import { ReleaseNoteDto, VersionDto } from '@shared/dtos/version.dto';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';

import api from '~/configs/axios';

export const useLauncherVersion = () => {
  const findAllVersionQuery = useQuery({
    queryKey: ['versions'],
    queryFn: async () => {
      const res = await api.get('versions');
      return res.data as VersionDto[];
    },
  });

  const findReleasesVersionQuery = useQuery({
    queryKey: ['releaseVersions'],
    queryFn: async () => {
      const res = await api.get('versions/releases');
      return res.data as VersionDto[];
    },
  });

  const findLoadersVersionQuery = useCallback((version: string, type: string) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useQuery({
      queryKey: ['loaderVersions', version, type],
      queryFn: async () => {
        const res = await api.get('versions/loaders', { params: { version, type } });
        return res.data as VersionDto[];
      },
    });
  }, []);

  const findReleaseNotesQuery = useInfiniteQuery({
    queryKey: ['releaseNote'],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await api.get('versions/releases/notes', { params: { pageIndex: pageParam, pageSize: 2 } });
      return res.data as ReleaseNoteDto[];
    },
    getNextPageParam: (_lastPage, allPages) => allPages.length + 1,
    initialPageParam: 1,
  });

  return {
    findAllVersionQuery,
    findReleasesVersionQuery,
    findLoadersVersionQuery,
    findReleaseNotesQuery,
  };
};
