import { LauncherConfigType } from '@shared/launcher.type';
import { useMutation, useQuery } from '@tanstack/react-query';

import { api } from '~/configs/axios';

export function useLauncherConfig() {
  const configQuery = useQuery({
    queryKey: ['launcherConfig'],
    queryFn: async () => {
      const res = await api('launcher/config');
      return res.data as LauncherConfigType;
    },
  });

  const setConfigMutation = useMutation({
    mutationFn: async ({ key, value }: { key: keyof LauncherConfigType; value: any }) => {
      const res = await api.post('launcher/config', { key, value });
      return res.data as LauncherConfigType;
    },
  });

  return {
    getConfig: configQuery,
    setConfig: setConfigMutation,
  };
}
