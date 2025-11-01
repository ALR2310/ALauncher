import { useEffect, useRef, useState } from 'react';

import { appCheckForUpdates, appInstallUpdates, FetchEventSource } from '~/api';

import { toast } from './useToast';

export function useUpdater() {
  const evtRef = useRef<FetchEventSource | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [progress, setProgress] = useState<number | undefined>(undefined);

  const checkForUpdates = async () => {
    setIsUpdating(true);

    const check = await appCheckForUpdates();

    if (check.hasUpdate) {
      evtRef.current = await appInstallUpdates();

      evtRef.current.addEventListener('progress', (e) => {
        setProgress(parseFloat(e.data));
      });
      evtRef.current.addEventListener('done', () => {
        setIsUpdating(false);
        setProgress(undefined);
        evtRef?.current?.close();
        toast.success('Updated successfully');
      });
      evtRef.current.addEventListener('error', () => {
        setIsUpdating(false);
        setProgress(undefined);
        evtRef?.current?.close();
      });
    } else {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    return () => {
      evtRef.current?.close();
    };
  }, []);

  return { checkForUpdates, isUpdating, progress };
}
