import { app } from '@tauri-apps/api';
import { useEffect, useRef, useState } from 'react';

export function useUpdater() {
  const evtRef = useRef<EventSource | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [progress, setProgress] = useState<number | undefined>(undefined);

  const checkForUpdates = async () => {
    const version = await app.getVersion();

    const url = `http://localhost:${import.meta.env.VITE_SERVER_PORT ?? 1421}/api/update?version=${version}`;
    evtRef.current = new EventSource(url);
    setIsUpdating(true);

    evtRef.current.addEventListener('progress', (e) => {
      setProgress(parseFloat(e.data));
    });
    evtRef.current.addEventListener('done', () => {
      setIsUpdating(false);
      setProgress(undefined);
      evtRef?.current?.close();
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
