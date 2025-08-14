import { LauncherConfigType } from '@shared/launcher.type';
import { useQuery } from '@tanstack/react-query';
import { createContext, useCallback, useEffect, useMemo, useState } from 'react';

import { useWS } from '~/hook/useWS';
import { getVersion } from '~/services/curseforge';

type VersionItem = { label: string; value: string; downloaded: boolean };

const LauncherContext = createContext<{
  launch: () => void;
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
  const { send, on } = useWS();
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState('');
  const [estimated, setEstimated] = useState('');
  const [configs, setConfigs] = useState<LauncherConfigType | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [version, setVersion] = useState('');
  const [versionDownloaded, setVersionDownloaded] = useState<string[]>([]);

  // Fetch initial configs
  useEffect(() => {
    send('launcher:config');
    send('version:downloaded');
  }, [send]);

  // Set configs when received from server
  on('launcher:config', (data) => setConfigs(data));

  // Set downloaded versions when received from server
  on('version:downloaded', setVersionDownloaded);

  // Function to set a config value
  const setConfigValue = useCallback(
    (key: string, value: any) => {
      send('launcher:config', { key, value });
    },
    [send],
  );

  // Function to launch the game
  const launch = useCallback(() => {
    send('launcher:launch');
    setIsPlaying(true);
  }, [send]);

  // Set up WebSocket event listeners
  on('launcher:log', (value) => setLogs((prev) => [...prev, value]));
  on('launcher:progress', (value) => setProgress(Number(value)));
  on('launcher:speed', (value) => setSpeed(value));
  on('launcher:estimated', (value) => setEstimated(value));
  on('launcher:extract', (value) => console.log('Extracting:', value));
  on('launcher:patch', (value) => console.log('Patching:', value));
  on('launcher:close', () => {
    setIsPlaying(false);
    setProgress(0);
  });

  // Api get versions
  const versionQuery = useQuery({
    queryKey: ['version'],
    queryFn: getVersion,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });

  // Prepare version list
  const baseVersionList = useMemo(() => {
    const raw = (versionQuery.data ?? []) as { versionString: string }[];

    const isSnapshot = (s: string) => s.toLowerCase().includes('snapshot');

    return raw
      .filter((v) => !isSnapshot(v.versionString))
      .map((v) => ({ label: `Release ${v.versionString}`, value: v.versionString }));
  }, [versionQuery.data]);

  // Prepare version list with downloaded status
  const versionList = useMemo(() => {
    if (!baseVersionList.length) return [];
    const downloadedSet = new Set(versionDownloaded);
    return baseVersionList.map((v) => ({ ...v, downloaded: downloadedSet.has(v.value) }));
  }, [baseVersionList, versionDownloaded]);

  // Set version based on configs or default to latest release
  useEffect(() => {
    if (!configs || !versionList.length) return;
    const desired = configs.version_selected;

    if (desired === 'latest_release') {
      setVersion(versionList[0].value);
      return;
    }
    const found = versionList.some((v) => v.value === desired);
    setVersion(found ? desired : versionList[0].value);
  }, [configs, versionList]);

  const contextValue = useMemo(
    () => ({
      launch,
      progress,
      speed,
      estimated,
      configs,
      setConfigs: setConfigValue,
      logs,
      isPlaying,
      version,
      versionList,
    }),
    [launch, progress, speed, estimated, configs, setConfigValue, logs, isPlaying, version, versionList],
  );

  return <LauncherContext.Provider value={contextValue}>{children}</LauncherContext.Provider>;
};

export { LauncherContext, LauncherProvider };
