import { useCallback, useEffect, useRef, useState } from 'react';

import { appCheckForUpdates, appInstallUpdates, FetchEventSource } from '~/api';

export function useUpdater() {
  const evtRef = useRef<FetchEventSource | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [progress, setProgress] = useState<number | undefined>(undefined);

  const checkForUpdates = useCallback(async () => {
    setIsUpdating(true);

    const check = await appCheckForUpdates();

    if (check.hasCoreUpdate || check.hasDataUpdate) {
      evtRef.current = await appInstallUpdates();

      evtRef.current.addEventListener('progress', (e) => {
        setProgress(parseFloat(e.data));
      });
      evtRef.current.addEventListener('done', () => {
        console.log('Update installed successfully, restarting app...');
        setIsUpdating(false);
        setProgress(undefined);
        evtRef?.current?.close();
        setTimeout(() => {
          console.log('App will restart to apply updates');
          location.replace(location.pathname + '?v=' + Date.now());
        }, 100);
      });
      evtRef.current.addEventListener('error', () => {
        setIsUpdating(false);
        setProgress(undefined);
        evtRef?.current?.close();
      });
    } else {
      setIsUpdating(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      evtRef.current?.close();
    };
  }, []);

  return { checkForUpdates, isUpdating, progress };
}
