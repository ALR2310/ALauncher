import { InstanceMeta, InstanceType, LauncherConfigType } from '@shared/launcher.type';
import { useMemo } from 'react';
import { createContext } from 'use-context-selector';

import { useLauncherConfig } from '~/hooks/launcher/useLauncherConfig';
import { useLauncherLifecycle } from '~/hooks/launcher/useLauncherLifecycle';
import { useLauncherLogs } from '~/hooks/launcher/useLauncherLogs';
import { useLauncherModpack } from '~/hooks/launcher/useLauncherModpack';
import { useLauncherProgress } from '~/hooks/launcher/useLauncherProgress';
import { useLauncherVersions } from '~/hooks/launcher/useLauncherVersions';

type VersionItem = { label: string; value: string; downloaded: boolean };
type versionLoader = { name: string; gameVersion: string; type: number; recommended?: boolean };

const LauncherContext = createContext<{
  launch: () => void;
  cancel: () => void;
  progress: number;
  speed: string;
  estimated: string;
  configs: LauncherConfigType | null;
  setConfigs: (key: string, value: any) => void;
  logs: string[];
  isPlaying: boolean;
  version: string;
  setVersion: (v: string) => void;
  versionList: VersionItem[];
  setVersionLoader: React.Dispatch<React.SetStateAction<string>>;
  loaderList: versionLoader[];
  instances: InstanceType[];
  createInstance: (instance: InstanceMeta) => void;
  updateInstance: (instance: InstanceMeta) => void;
  deleteInstance: (slug: string) => void;
}>(null!);

const LauncherProvider = ({ children }) => {
  const { configs, setConfigs } = useLauncherConfig();
  const { version, versionList, setVersionLoader, loaderList } = useLauncherVersions(configs);
  const { isPlaying, launch, cancel } = useLauncherLifecycle();
  const { progress, speed, estimated } = useLauncherProgress();
  const { logs } = useLauncherLogs();
  const { instances, createInstance, updateInstance, deleteInstance } = useLauncherModpack();

  const contextValue = useMemo(
    () => ({
      launch,
      cancel,
      progress,
      speed,
      estimated,
      configs,
      setConfigs,
      logs,
      isPlaying,
      version,
      setVersion: (v: string) => setConfigs('version_selected', v),
      versionList,
      setVersionLoader,
      loaderList,
      instances,
      createInstance,
      updateInstance,
      deleteInstance,
    }),
    [
      launch,
      cancel,
      progress,
      speed,
      estimated,
      configs,
      setConfigs,
      logs,
      isPlaying,
      version,
      versionList,
      setVersionLoader,
      loaderList,
      instances,
      createInstance,
      updateInstance,
      deleteInstance,
    ],
  );

  return <LauncherContext.Provider value={contextValue}>{children}</LauncherContext.Provider>;
};

export { LauncherContext, LauncherProvider };
