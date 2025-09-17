import { useMemo } from 'react';
import { createContext } from 'use-context-selector';

import api from '~/configs/axios';
import { useLauncherCategory } from '~/hooks/launcher/useLauncherCategory';
import { useLauncherConfig } from '~/hooks/launcher/useLauncherConfig';
import { useLauncherContent } from '~/hooks/launcher/useLauncherContent';
import { useLauncherInstance } from '~/hooks/launcher/useLauncherInstance';
import { useLauncherLifeCycle } from '~/hooks/launcher/useLauncherLifeCycle';
import { useLauncherVersion } from '~/hooks/launcher/useLauncherVersion';
import { useLauncherWorld } from '~/hooks/launcher/useLauncherWorld';

const LauncherContext = createContext<{
  getConfig: ReturnType<typeof useLauncherConfig>['getConfig'];
  setConfig: ReturnType<typeof useLauncherConfig>['setConfig'];
  findAllVersionQuery: ReturnType<typeof useLauncherVersion>['findAllVersionQuery'];
  findReleasesVersionQuery: ReturnType<typeof useLauncherVersion>['findReleasesVersionQuery'];
  findLoadersVersionQuery: ReturnType<typeof useLauncherVersion>['findLoadersVersionQuery'];
  findReleaseNotesQuery: ReturnType<typeof useLauncherVersion>['findReleaseNotesQuery'];
  findAllCategoryQuery: ReturnType<typeof useLauncherCategory>['findAllCategoryQuery'];
  openFolder: () => void;
  event: ReturnType<typeof useLauncherLifeCycle>['event'];
  isRunning: ReturnType<typeof useLauncherLifeCycle>['isRunning'];
  isDownloading: ReturnType<typeof useLauncherLifeCycle>['isDownloading'];
  launch: ReturnType<typeof useLauncherLifeCycle>['launch'];
  cancel: ReturnType<typeof useLauncherLifeCycle>['cancel'];
  findAllInstanceQuery: ReturnType<typeof useLauncherInstance>['findAllInstanceQuery'];
  findOneInstanceQuery: ReturnType<typeof useLauncherInstance>['findOneInstanceQuery'];
  createInstanceMutation: ReturnType<typeof useLauncherInstance>['createInstanceMutation'];
  updateInstanceMutation: ReturnType<typeof useLauncherInstance>['updateInstanceMutation'];
  deleteInstanceMutation: ReturnType<typeof useLauncherInstance>['deleteInstanceMutation'];
  findContentInstanceQuery: ReturnType<typeof useLauncherInstance>['findContentInstanceQuery'];
  removeContentInstanceMutation: ReturnType<typeof useLauncherInstance>['removeContentInstanceMutation'];
  canRemoveContentInstanceMutation: ReturnType<typeof useLauncherInstance>['canRemoveContentInstanceMutation'];
  toggleContentInstanceMutation: ReturnType<typeof useLauncherInstance>['toggleContentInstanceMutation'];
  findAllContentQuery: ReturnType<typeof useLauncherContent>['findAllContentQuery'];
  findAllWorldQuery: ReturnType<typeof useLauncherWorld>['findAllWorldQuery'];
}>(null!);

const LauncherProvider = ({ children }) => {
  const { getConfig, setConfig } = useLauncherConfig();
  const { findAllVersionQuery, findReleasesVersionQuery, findLoadersVersionQuery, findReleaseNotesQuery } =
    useLauncherVersion();
  const { findAllCategoryQuery } = useLauncherCategory();
  const { event, isRunning, isDownloading, launch, cancel } = useLauncherLifeCycle();
  const {
    findAllInstanceQuery,
    findOneInstanceQuery,
    createInstanceMutation,
    updateInstanceMutation,
    deleteInstanceMutation,
    findContentInstanceQuery,
    removeContentInstanceMutation,
    canRemoveContentInstanceMutation,
    toggleContentInstanceMutation,
  } = useLauncherInstance();
  const { findAllContentQuery } = useLauncherContent();
  const { findAllWorldQuery } = useLauncherWorld();

  const ctx = useMemo(
    () => ({
      getConfig,
      setConfig,
      findAllVersionQuery,
      findReleasesVersionQuery,
      findLoadersVersionQuery,
      findReleaseNotesQuery,
      findAllCategoryQuery,
      openFolder: () => api.get('/launchers/folder'),
      event,
      isRunning,
      isDownloading,
      launch,
      cancel,
      findAllInstanceQuery,
      findOneInstanceQuery,
      createInstanceMutation,
      updateInstanceMutation,
      deleteInstanceMutation,
      findContentInstanceQuery,
      removeContentInstanceMutation,
      canRemoveContentInstanceMutation,
      toggleContentInstanceMutation,
      findAllContentQuery,
      findAllWorldQuery,
    }),
    [
      canRemoveContentInstanceMutation,
      cancel,
      createInstanceMutation,
      deleteInstanceMutation,
      event,
      findAllCategoryQuery,
      findAllContentQuery,
      findAllInstanceQuery,
      findAllVersionQuery,
      findAllWorldQuery,
      findContentInstanceQuery,
      findLoadersVersionQuery,
      findOneInstanceQuery,
      findReleaseNotesQuery,
      findReleasesVersionQuery,
      getConfig,
      isDownloading,
      isRunning,
      launch,
      removeContentInstanceMutation,
      setConfig,
      toggleContentInstanceMutation,
      updateInstanceMutation,
    ],
  );

  return <LauncherContext.Provider value={ctx}>{children}</LauncherContext.Provider>;
};

export { LauncherContext, LauncherProvider };
