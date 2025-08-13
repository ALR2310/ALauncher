import { LauncherConfigType } from '@shared/launcher.type';
import { useQuery } from '@tanstack/react-query';
import { createContext, useEffect, useState } from 'react';

import { useWS } from '~/hook/useWS';
import { getVersion } from '~/services/curseforge';

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
  versionList: { label: string; value: string }[];
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
  const [versionList, setVersionList] = useState<{ label: string; value: string; downloaded: boolean }[]>([]);
  const [versionDownloaded, setVersionDownloaded] = useState<string[]>([]);

  // Api get versions
  const versionQuery = useQuery({
    queryKey: ['version'],
    queryFn: getVersion,
  });

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
  const setConfigValue = (key: string, value: any) => {
    send('launcher:config', { key, value });
  };

  // Function to launch the game
  const launch = () => {
    send('launcher:launch');
    setIsPlaying(true);
  };

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

  // Set version list when received from server
  useEffect(() => {
    if (versionQuery.isLoading) return;
    setVersionList(versionQuery.data.map((v: any) => ({ label: v.versionString, value: v.versionString })));
  }, [versionQuery.data, versionQuery.isLoading]);

  // Set version based on configs or latest release
  useEffect(() => {
    if (versionList.length === 0 || !configs) return;
    if (configs.version_selected === 'latest_release') {
      setVersion(versionList[0].value);
    } else {
      setVersion(configs.version_selected);
    }
  }, [configs, versionList]);

  // Update version list with downloaded status
  useEffect(() => {
    if (versionList.length && versionDownloaded.length) {
      setVersionList((prev) => {
        const downloadedSet = new Set(versionDownloaded);
        return prev.map((item) => ({
          ...item,
          downloaded: downloadedSet.has(item.value),
        }));
      });
    }
  }, [versionDownloaded, versionList.length]);

  return (
    <LauncherContext.Provider
      value={{
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
      }}
    >
      {children}
    </LauncherContext.Provider>
  );
};

export { LauncherContext, LauncherProvider };
