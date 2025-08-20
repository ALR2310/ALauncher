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
  instance: InstanceType | null;
  instances: InstanceMeta[];
  getInstance: (slug: string) => void;
  createInstance: (instance: InstanceMeta) => void;
  createInstanceResult: any;
  updateInstance: (instance: InstanceMeta) => void;
  updateInstanceResult: any;
  deleteInstance: (slug: string) => void;
  deleteInstanceResult: any;
}>(null!);

const LauncherProvider = ({ children }) => {
  const { configs, setConfigs } = useLauncherConfig();
  const { version, versionList, setVersionLoader, loaderList } = useLauncherVersions(configs);
  const { isPlaying, launch, cancel } = useLauncherLifecycle();
  const { progress, speed, estimated } = useLauncherProgress();
  const { logs } = useLauncherLogs();
  const {
    instance,
    instances,
    getInstance,
    createInstance,
    createInstanceResult,
    updateInstance,
    updateInstanceResult,
    deleteInstance,
    deleteInstanceResult,
  } = useLauncherModpack();

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
      instance,
      instances,
      getInstance,
      createInstance,
      createInstanceResult,
      updateInstance,
      updateInstanceResult,
      deleteInstance,
      deleteInstanceResult,
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
      instance,
      instances,
      getInstance,
      createInstance,
      createInstanceResult,
      updateInstance,
      updateInstanceResult,
      deleteInstance,
      deleteInstanceResult,
    ],
  );

  return <LauncherContext.Provider value={contextValue}>{children}</LauncherContext.Provider>;
};

export { LauncherContext, LauncherProvider };
