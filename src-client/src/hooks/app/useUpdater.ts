import { useEffect, useRef, useState } from 'react';

import { appUpdate } from '~/api';

import { toast } from './useToast';

export function useUpdater() {
  const evtRef = useRef<EventSource | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [progress, setProgress] = useState<number | undefined>(undefined);

  const checkForUpdates = async () => {
    evtRef.current = await appUpdate();
    setIsUpdating(true);

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
  };

  useEffect(() => {
    return () => {
      evtRef.current?.close();
    };
  }, []);

  return { checkForUpdates, isUpdating, progress };
}
