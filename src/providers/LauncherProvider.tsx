import { LauncherConfigType } from '@shared/launcher.type';
import { createContext, useMemo } from 'react';

import { useLauncherConfig } from '~/hooks/launcher/useLauncherConfig';
import { useLauncherLifecycle } from '~/hooks/launcher/useLauncherLifecycle';
import { useLauncherLogs } from '~/hooks/launcher/useLauncherLogs';
import { useLauncherProgress } from '~/hooks/launcher/useLauncherProgress';
import { useLauncherVersions } from '~/hooks/launcher/useLauncherVersions';

type VersionItem = { label: string; value: string; downloaded: boolean };

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
  versionList: VersionItem[];
}>(null!);

const LauncherProvider = ({ children }) => {
  const { configs, setConfigs } = useLauncherConfig();
  const { version, versionList } = useLauncherVersions(configs);
  const { isPlaying, launch, cancel } = useLauncherLifecycle();
  const { progress, speed, estimated } = useLauncherProgress();
  const { logs } = useLauncherLogs();

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
      versionList,
    }),
    [launch, cancel, progress, speed, estimated, configs, setConfigs, logs, isPlaying, version, versionList],
  );

  return <LauncherContext.Provider value={contextValue}>{children}</LauncherContext.Provider>;
};

export { LauncherContext, LauncherProvider };
