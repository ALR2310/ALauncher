import { useMemo } from 'react';
import { createContext } from 'use-context-selector';

import api from '~/configs/axios';
import { useLauncherCategory } from '~/hooks/launcher/useLauncherCategory';
import { useLauncherConfig } from '~/hooks/launcher/useLauncherConfig';
import { useLauncherInstance } from '~/hooks/launcher/useLauncherInstance';
import { useLauncherLifeCycle } from '~/hooks/launcher/useLauncherLifeCycle';
import { useLauncherVersion } from '~/hooks/launcher/useLauncherVersion';

const LauncherContext = createContext<{
  getConfig: ReturnType<typeof useLauncherConfig>['getConfig'];
  setConfig: ReturnType<typeof useLauncherConfig>['setConfig'];
  versionsQuery: ReturnType<typeof useLauncherVersion>['versionsQuery'];
  releaseVersionsQuery: ReturnType<typeof useLauncherVersion>['releaseVersionsQuery'];
  loaderVersionsQuery: ReturnType<typeof useLauncherVersion>['loaderVersionsQuery'];
  releaseNoteQuery: ReturnType<typeof useLauncherVersion>['releaseNoteQuery'];
  categoryMutation: ReturnType<typeof useLauncherCategory>['categoryMutation'];
  openFolder: () => void;
  event: ReturnType<typeof useLauncherLifeCycle>['event'];
  isRunning: boolean;
  isDownloading: boolean;
  launch: () => void;
  cancel: () => void;
  getAllInstanceQuery: ReturnType<typeof useLauncherInstance>['getAllInstanceQuery'];
  getInstanceQuery: ReturnType<typeof useLauncherInstance>['getInstanceQuery'];
  createInstanceMutation: ReturnType<typeof useLauncherInstance>['createInstanceMutation'];
  updateInstanceMutation: ReturnType<typeof useLauncherInstance>['updateInstanceMutation'];
  deleteInstanceMutation: ReturnType<typeof useLauncherInstance>['deleteInstanceMutation'];
}>(null!);

const LauncherProvider = ({ children }) => {
  const { getConfig, setConfig } = useLauncherConfig();
  const { versionsQuery, releaseVersionsQuery, loaderVersionsQuery, releaseNoteQuery } = useLauncherVersion();
  const { categoryMutation } = useLauncherCategory();
  const { event, isRunning, isDownloading, launch, cancel } = useLauncherLifeCycle();
  const {
    getAllInstanceQuery,
    getInstanceQuery,
    createInstanceMutation,
    updateInstanceMutation,
    deleteInstanceMutation,
  } = useLauncherInstance();

  const ctx = useMemo(
    () => ({
      getConfig,
      setConfig,
      versionsQuery,
      releaseVersionsQuery,
      loaderVersionsQuery,
      releaseNoteQuery,
      categoryMutation,
      openFolder: () => api.get('/launcher/folder'),
      event,
      isRunning,
      isDownloading,
      launch,
      cancel,
      getAllInstanceQuery,
      getInstanceQuery,
      createInstanceMutation,
      updateInstanceMutation,
      deleteInstanceMutation,
    }),
    [
      getConfig,
      setConfig,
      versionsQuery,
      releaseVersionsQuery,
      loaderVersionsQuery,
      releaseNoteQuery,
      categoryMutation,
      event,
      isRunning,
      isDownloading,
      launch,
      cancel,
      getAllInstanceQuery,
      getInstanceQuery,
      createInstanceMutation,
      updateInstanceMutation,
      deleteInstanceMutation,
    ],
  );

  return <LauncherContext.Provider value={ctx}>{children}</LauncherContext.Provider>;
};

export { LauncherContext, LauncherProvider };
