import { useMutation, useQuery } from '@tanstack/react-query';

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
  return useMutation({
    mutationFn: appSetConfig,
  });
};

export const useAppOpenFolderMutation = () => {
  return useMutation({
    mutationFn: appOpenFolder,
  });
};
