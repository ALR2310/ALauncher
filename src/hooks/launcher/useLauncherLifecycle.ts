import { useCallback, useRef, useState } from 'react';

import api from '~/configs/axios';

export function useLauncherLifeCycle() {
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [speed, setSpeed] = useState('');
  const [estimated, setEstimated] = useState('');
  const [extract, setExtract] = useState('');
  const [patch, setPatch] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const evtRef = useRef<EventSource | null>(null);

  const launch = useCallback(() => {
    if (evtRef.current) return;

    evtRef.current = new EventSource(`http://localhost:${import.meta.env.VITE_SERVER_PORT}/api/launcher/launch`);

    setIsRunning(true);
    setIsDownloading(true);

    evtRef.current.addEventListener('progress', (e: MessageEvent) => setProgress(Number(e.data)));
    evtRef.current.addEventListener('log', (e: MessageEvent) => {
      setLogs((prev) => [...prev, e.data]);
      setIsDownloading(false);
    });
    evtRef.current.addEventListener('speed', (e: MessageEvent) => setSpeed(e.data));
    evtRef.current.addEventListener('estimated', (e: MessageEvent) => setEstimated(e.data));
    evtRef.current.addEventListener('extract', (e: MessageEvent) => setExtract(e.data));
    evtRef.current.addEventListener('patch', (e: MessageEvent) => setPatch(e.data));
    evtRef.current.addEventListener('close', () => {
      setIsRunning(false);
      setIsDownloading(false);
      evtRef.current?.close();
      evtRef.current = null;
    });
    evtRef.current?.addEventListener('cancelled', () => {
      setIsRunning(false);
      setIsDownloading(false);
      evtRef.current?.close();
      evtRef.current = null;
    });
    evtRef.current?.addEventListener('error', (e) => {
      console.error('SSE error', e);
      setIsRunning(false);
      setIsDownloading(false);
      evtRef.current?.close();
      evtRef.current = null;
    });
  }, []);

  const cancel = useCallback(() => {
    api.get('launcher/cancel');

    // Reset state
    setIsRunning(false);
    setIsDownloading(false);
    setProgress(0);
    setLogs([]);
    setSpeed('');
    setEstimated('');
    setExtract('');
    setPatch('');

    if (evtRef.current) {
      evtRef.current.close();
      evtRef.current = null;
    }
  }, []);

  return {
    event: {
      progress,
      logs,
      speed,
      estimated,
      extract,
      patch,
    },
    isRunning,
    isDownloading,
    launch,
    cancel,
  };
}
