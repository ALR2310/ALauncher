import { useMutation, useQuery } from '@tanstack/react-query';

import { api } from '~/configs/axios';

export interface MCVersion {
  name: string;
  version: string;
  downloaded: boolean;
}

export interface LDVersion {
  name: string;
  gameVersion: string;
  latest: boolean;
  recommended: boolean;
  type: string;
}

export function useLauncherVersion() {
  const versionsQuery = useQuery({
    queryKey: ['launcherVersions'],
    queryFn: async () => {
      const res = await api('versions');
      return res.data as MCVersion[];
    },
  });

  const loadersMutation = useMutation({
    mutationFn: async (version: string) => {
      const res = await api(`versions/loader/${version}`);
      return res.data as LDVersion[];
    },
  });

  return {
    getVersions: versionsQuery,
    getLoaders: loadersMutation,
  };
}
