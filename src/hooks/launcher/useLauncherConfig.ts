import { LauncherConfigType } from '@shared/launcher.type';
import { useCallback, useEffect, useState } from 'react';

import { useWS } from '../useWS';

export function useLauncherConfig() {
  const { send, on } = useWS();
  const [configs, setConfigs] = useState<LauncherConfigType | null>(null);

  useEffect(() => {
    send('launcher:config');
  }, [send]);

  on('launcher:config', (data) => setConfigs(data));

  const setConfigValue = useCallback(
    (key: string, value: any) => {
      send('launcher:config', { key, value });
    },
    [send],
  );

  return { configs, setConfigs: setConfigValue };
}
