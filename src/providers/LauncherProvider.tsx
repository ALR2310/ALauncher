import { useQuery } from '@tanstack/react-query';
import { createContext, useEffect, useState } from 'react';

import { useWS, useWSListener } from '~/hook/useWS';
import { getVersion } from '~/services/curseforge';

const LauncherContext = createContext<{
  launch: () => void;
  progress: number;
  speed: string;
  estimated: string;
  configs: any;
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
  const [configs, setConfigs] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [version, setVersion] = useState('');
  const [versionList, setVersionList] = useState<{ label: string; value: string }[]>([]);

  // Api get versions
  const versionQuery = useQuery({
    queryKey: ['version'],
    queryFn: getVersion,
  });

  const setConfigValue = (key: string, value: any) => {
    send('appConfig', { key, value });
  };

  const launch = () => {
    send('launcher_play');
    setIsPlaying(true);
  };

  useEffect(() => {
    send('appConfig');
  }, [on, send]);

  useWSListener('appConfig', (data) => {
    setConfigs(data);
  });

  on('launcher_log', (value) => setLogs((prev) => [...prev, value]));
  on('launcher_progress', (value) => setProgress(Number(value)));
  on('launcher_speed', (value) => setSpeed(value));
  on('launcher_estimated', (value) => setEstimated(value));
  on('launcher_close', () => setIsPlaying(false));

  useEffect(() => {
    if (versionQuery.isLoading) return;
    setVersionList(versionQuery.data.map((v: any) => ({ label: v.versionString, value: v.versionString })));
  }, [versionQuery.data, versionQuery.isLoading]);

  useEffect(() => {
    if (versionList.length === 0 || !configs) return;
    if (configs.version_selected === 'latest_release') {
      setVersion(versionList[0].value);
    } else {
      setVersion(configs.version_selected);
    }
  }, [configs, versionList]);

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
