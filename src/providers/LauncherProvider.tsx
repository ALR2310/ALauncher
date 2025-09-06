import { useMemo } from 'react';
import { createContext } from 'use-context-selector';

import api from '~/configs/axios';
import { useLauncherAdditional } from '~/hooks/launcher/useLauncherAdditional';
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
  categoryQuery: ReturnType<typeof useLauncherCategory>['categoryQuery'];
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
  getAdditionalQuery: ReturnType<typeof useLauncherAdditional>['getAdditionalQuery'];
}>(null!);

const LauncherProvider = ({ children }) => {
  const { getConfig, setConfig } = useLauncherConfig();
  const { versionsQuery, releaseVersionsQuery, loaderVersionsQuery, releaseNoteQuery } = useLauncherVersion();
  const { categoryQuery } = useLauncherCategory();
  const { event, isRunning, isDownloading, launch, cancel } = useLauncherLifeCycle();
  const {
    getAllInstanceQuery,
    getInstanceQuery,
    createInstanceMutation,
    updateInstanceMutation,
    deleteInstanceMutation,
  } = useLauncherInstance();
  const { getAdditionalQuery } = useLauncherAdditional();

  const ctx = useMemo(
    () => ({
      getConfig,
      setConfig,
      versionsQuery,
      releaseVersionsQuery,
      loaderVersionsQuery,
      releaseNoteQuery,
      categoryQuery,
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
      getAdditionalQuery,
    }),
    [
      getConfig,
      setConfig,
      versionsQuery,
      releaseVersionsQuery,
      loaderVersionsQuery,
      releaseNoteQuery,
      categoryQuery,
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
      getAdditionalQuery,
    ],
  );

  return <LauncherContext.Provider value={ctx}>{children}</LauncherContext.Provider>;
};

export { LauncherContext, LauncherProvider };
