import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { appExit, appGetConfig, appOpenFolder, appSetConfig, appVersion } from '~/api';

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appConfig'] });
    },
  });
};

export const useAppOpenFolderMutation = () => {
  return useMutation({
    mutationFn: appOpenFolder,
  });
};
