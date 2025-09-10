import { LauncherConfig } from '@shared/schemas/launcher.schema';
import { useMutation, useQuery } from '@tanstack/react-query';

import api from '~/configs/axios';

export const useLauncherConfig = () => {
  const getLauncherConfigQuery = useQuery({
    queryKey: ['launcherConfig'],
    queryFn: async () => {
      const res = await api.get('/launcher/config');
      return res.data as LauncherConfig;
    },
  });

  const setLauncherConfigMutation = useMutation({
    mutationFn: async ({ key, value }: { key: keyof LauncherConfig; value: any }) => {
      const res = await api.post('/launcher/config', { key, value });
      return res.data as LauncherConfig;
    },
    onSuccess: () => {
      getLauncherConfigQuery.refetch();
    },
  });

  return {
    getConfig: () => getLauncherConfigQuery.data,
    setConfig: (key: keyof LauncherConfig | any, value: any) => setLauncherConfigMutation.mutate({ key, value }),
  };
};
