import { AppConfigDto } from '@shared/dtos/app.dto';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { appExit, appGetConfig, appOpenFolder, appSetConfig, appVersion, getSystemInfo } from '~/api';

export const useAppVersionQuery = () => {
  return useQuery({
    queryKey: ['appVersion'],
    queryFn: appVersion,
  });
};

export const useAppExitMutation = () => {
  return useMutation({
    mutationFn: appExit,
  });
};

export const useAppSystemInfoQuery = () => {
  return useQuery({
    queryKey: ['systemInfo'],
    queryFn: getSystemInfo,
  });
};

export const useAppGetConfigQuery = () => {
  return useQuery({
    queryKey: ['appConfig'],
    queryFn: appGetConfig,
    refetchOnWindowFocus: true,
  });
};

export const useAppSetConfigMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: appSetConfig,
    onMutate: async (newConfig) => {
      await queryClient.cancelQueries({ queryKey: ['appConfig'] });

      const prevConfig = queryClient.getQueryData(['appConfig']);

      queryClient.setQueryData(['appConfig'], (oldConfig: AppConfigDto | undefined) => {
        if (!oldConfig) return oldConfig;
        const { key, value } = newConfig;

        const keys = key.split('.');
        const newObj = structuredClone(oldConfig);

        let target = newObj;
        for (let i = 0; i < keys.length - 1; i++) {
          target = target[keys[i]];
        }
        target[keys[keys.length - 1]] = value;
        return newObj;
      });

      return { prevConfig };
    },
    onError: (_err, _newConfig, context) => {
      if (context?.prevConfig) {
        queryClient.setQueryData(['appConfig'], context.prevConfig);
      }
    },
  });
};

export const useAppOpenFolderMutation = () => {
  return useMutation({
    mutationFn: appOpenFolder,
  });
};
