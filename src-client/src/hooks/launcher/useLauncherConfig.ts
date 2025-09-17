import { LauncherConfigDto, LauncherConfigKey, UpdateLauncherConfigDto } from '@shared/dtos/launcher.dto';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';

import api from '~/configs/axios';

export const useLauncherConfig = () => {
  const getLauncherConfigQuery = useQuery({
    queryKey: ['launcherConfig'],
    queryFn: async () => {
      const res = await api.get('/launchers/config');
      return res.data as LauncherConfigDto;
    },
  });

  const setLauncherConfigMutation = useMutation({
    mutationFn: async ({ key, value }: UpdateLauncherConfigDto) => {
      const res = await api.post('/launchers/config', { key, value });
      return res.data as LauncherConfigDto;
    },
    onSuccess: () => {
      getLauncherConfigQuery.refetch();
    },
  });

  const getConfig = useCallback(() => getLauncherConfigQuery.data, [getLauncherConfigQuery.data]);
  const setConfig = useCallback(
    (key: LauncherConfigKey, value: any) => setLauncherConfigMutation.mutate({ key, value }),
    [setLauncherConfigMutation],
  );

  return { getConfig, setConfig };
};
