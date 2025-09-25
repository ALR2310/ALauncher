import { LauncherConfigKey, UpdateLauncherConfigDto } from '@shared/dtos/launcher.dto';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  getLauncherConfig,
  launcherCancel,
  launcherLaunch,
  launcherVerify,
  setLauncherConfig,
} from '~/api/launcher.api';

import { toast } from '../app/useToast';

export function useLauncher() {
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [speed, setSpeed] = useState('');
  const [estimated, setEstimated] = useState('');
  const [extract, setExtract] = useState('');
  const [patch, setPatch] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const verifyEvtRef = useRef<EventSource | null>(null);
  const launchEvtRef = useRef<EventSource | null>(null);

  useEffect(() => {
    return () => {
      verifyEvtRef.current?.close();
      verifyEvtRef.current = null;
      launchEvtRef.current?.close();
      launchEvtRef.current = null;
    };
  }, []);

  const configQuery = useQuery({
    queryKey: ['launcher-config'],
    queryFn: getLauncherConfig,
  });

  const configMutation = useMutation({
    mutationFn: (params: UpdateLauncherConfigDto) => setLauncherConfig(params),
    onSuccess: () => configQuery.refetch(),
  });

  const setConfig = (key: LauncherConfigKey, value: any) => configMutation.mutate({ key, value });

  const launch = useCallback(() => {
    if (verifyEvtRef.current) return;

    verifyEvtRef.current = launcherVerify();

    setIsVerifying(true);
    setIsDownloading(true);
    setProgress(100);
    setSpeed('');
    setEstimated('');

    verifyEvtRef.current.addEventListener('progress', (e: MessageEvent) => setProgress(Number(e.data)));
    verifyEvtRef.current.addEventListener('speed', (e: MessageEvent) => setSpeed(e.data));
    verifyEvtRef.current.addEventListener('estimated', (e: MessageEvent) => setEstimated(e.data));

    verifyEvtRef.current.addEventListener('done', () => {
      verifyEvtRef.current?.close();
      verifyEvtRef.current = null;

      setIsVerifying(false);
      setSpeed('');
      setEstimated('');

      // Start launching
      launchEvtRef.current = launcherLaunch();

      setIsRunning(true);
      setIsDownloading(true);

      launchEvtRef.current.addEventListener('progress', (e: MessageEvent) => setProgress(Number(e.data)));
      launchEvtRef.current.addEventListener('log', (e: MessageEvent) => {
        setLogs((prev) => [...prev.slice(-499), e.data]);
        setIsDownloading(false);
      });
      launchEvtRef.current.addEventListener('speed', (e: MessageEvent) => setSpeed(e.data));
      launchEvtRef.current.addEventListener('estimated', (e: MessageEvent) => setEstimated(e.data));
      launchEvtRef.current.addEventListener('extract', (e: MessageEvent) => setExtract(e.data));
      launchEvtRef.current.addEventListener('patch', (e: MessageEvent) => setPatch(e.data));
      launchEvtRef.current.addEventListener('close', () => {
        setIsRunning(false);
        setIsDownloading(false);
        launchEvtRef.current?.close();
        launchEvtRef.current = null;
      });
      launchEvtRef.current?.addEventListener('cancelled', () => {
        setIsRunning(false);
        setIsDownloading(false);
        launchEvtRef.current?.close();
        launchEvtRef.current = null;
      });
      launchEvtRef.current?.addEventListener('error', (e) => {
        console.error('SSE error', e);
        setIsRunning(false);
        setIsDownloading(false);
        launchEvtRef.current?.close();
        launchEvtRef.current = null;
      });
    });

    verifyEvtRef.current.addEventListener('error', () => {
      setIsVerifying(false);
      setIsDownloading(false);
      setProgress(0);
      setSpeed('');
      setEstimated('');
      verifyEvtRef.current?.close();
      verifyEvtRef.current = null;
      toast.error('Failed to verify. Please try again.');
    });
  }, []);

  const cancel = useCallback(() => {
    launcherCancel();

    // Reset state
    setIsRunning(false);
    setIsDownloading(false);
    setProgress(0);
    setLogs([]);
    setSpeed('');
    setEstimated('');
    setExtract('');
    setPatch('');

    if (verifyEvtRef.current) {
      verifyEvtRef.current.close();
      verifyEvtRef.current = null;
    }

    if (launchEvtRef.current) {
      launchEvtRef.current.close();
      launchEvtRef.current = null;
    }
  }, []);

  return {
    config: configQuery.data,
    setConfig,
    launch,
    cancel,
    event: {
      isVerifying,
      isRunning,
      isDownloading,
      progress,
      logs,
      speed,
      estimated,
      extract,
      patch,
    },
  };
}
