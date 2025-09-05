import { ReleaseNote, Version } from '@shared/types/version.type';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';

import api from '~/configs/axios';

export const useLauncherVersion = () => {
  const versionsQuery = useQuery({
    queryKey: ['versions'],
    queryFn: async () => {
      const res = await api.get('version');
      return res.data as Version[];
    },
  });

  const releaseVersionsQuery = useQuery({
    queryKey: ['releaseVersions'],
    queryFn: async () => {
      const res = await api.get('version/release');
      return res.data as Version[];
    },
  });

  const loaderVersionsQuery = useCallback((version: string, type: string) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useQuery({
      queryKey: ['loaderVersions', version, type],
      queryFn: async () => {
        const res = await api.get('version/loader', { params: { version, type } });
        return res.data as Version[];
      },
    });
  }, []);

  const releaseNoteQuery = useInfiniteQuery({
    queryKey: ['releaseNote'],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await api.get('version/note', { params: { pageIndex: pageParam, pageSize: 2 } });
      return res.data as ReleaseNote[];
    },
    getNextPageParam: (_lastPage, allPages) => allPages.length + 1,
    initialPageParam: 1,
  });

  return { versionsQuery, releaseVersionsQuery, loaderVersionsQuery, releaseNoteQuery };
};
