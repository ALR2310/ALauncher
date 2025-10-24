import { InstanceContentAddQueryDto, InstanceContentQueryDto, InstanceQueryDto } from '@shared/dtos/instance.dto';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  instanceAddContent,
  instanceCancel,
  instanceCreate,
  instanceDelete,
  instanceFindAll,
  instanceFindOne,
  instanceFindWorlds,
  instanceGetContents,
  instanceLaunch,
  instanceRemoveContent,
  instanceToggleContent,
  instanceUpdate,
  instanceVerify,
} from '~/api/instance.api';

import { toast } from '../app/useToast';

export function useInstancesQuery(param?: InstanceQueryDto) {
  return useQuery({
    queryKey: ['instances', param],
    queryFn: () => instanceFindAll(param),
  });
}

export function useInstanceOneQuery(id: string) {
  return useQuery({
    queryKey: ['instance', id],
    queryFn: () => instanceFindOne(id),
    enabled: !!id,
  });
}

export function useInstanceCreateMutation() {
  return useMutation({
    mutationFn: instanceCreate,
  });
}

export function useInstanceUpdateMutation() {
  return useMutation({
    mutationFn: instanceUpdate,
  });
}

export function useInstanceDeleteMutation() {
  return useMutation({
    mutationFn: instanceDelete,
  });
}

export function useInstanceWorldsQuery(id: string) {
  return useQuery({
    queryKey: ['instanceWorlds', id],
    queryFn: () => instanceFindWorlds(id),
    enabled: !!id,
  });
}

export function useInstanceVerifySSE() {
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState<number | undefined>(undefined);
  const [speed, setSpeed] = useState('');
  const [estimated, setEstimated] = useState('');
  const [isDone, setIsDone] = useState(false);
  const evtRef = useRef<EventSource | null>(null);

  const verifyContent = useCallback((id: string) => {
    if (evtRef.current) return;
    evtRef.current = instanceVerify(id);

    setIsDownloading(true);
    setProgress(undefined);
    setSpeed('');
    setEstimated('');
    setIsDone(false);

    evtRef.current.addEventListener('progress', (e) => setProgress(parseFloat(e.data)));
    evtRef.current.addEventListener('speed', (e) => setSpeed(e.data));
    evtRef.current.addEventListener('estimated', (e) => setEstimated(e.data));
    evtRef.current.addEventListener('done', () => {
      setIsDownloading(false);
      setProgress(100);
      setIsDone(true);
      evtRef?.current?.close();
    });
    evtRef.current.addEventListener('error', () => {
      setIsDownloading(false);
      toast.error('Failed to install. Please try again.');
      evtRef?.current?.close();
      evtRef.current = null;
    });
  }, []);

  useEffect(() => {
    return () => evtRef.current?.close();
  }, []);

  return { verifyContent, isDownloading, progress, speed, estimated, isDone };
}

export function useInstanceLaunchSSE() {
  const [progress, setProgress] = useState<number | undefined>(undefined);
  const [logs, setLogs] = useState<string[]>([]);
  const [speed, setSpeed] = useState('');
  const [estimated, setEstimated] = useState('');
  const [extract, setExtract] = useState('');
  const [patch, setPatch] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const launchEvtRef = useRef<EventSource | null>(null);

  const cleanupConnection = useCallback(() => {
    if (launchEvtRef.current) {
      launchEvtRef.current.close();
      launchEvtRef.current = null;
    }
  }, []);

  const launch = useCallback(
    (id: string) => {
      if (launchEvtRef.current) return;

      // Reset state
      setIsRunning(true);
      setIsDownloading(true);
      setProgress(undefined);
      setLogs([]);
      setSpeed('');
      setEstimated('');
      setExtract('');
      setPatch('');

      launchEvtRef.current = instanceLaunch(id);

      launchEvtRef.current.addEventListener('progress', (e: MessageEvent) => setProgress(Number(e.data)));
      launchEvtRef.current.addEventListener('log', (e: MessageEvent) => {
        setLogs((prev) => [...prev.slice(-499), e.data]);
        setIsDownloading(false);
        setProgress(undefined);
      });
      launchEvtRef.current.addEventListener('speed', (e: MessageEvent) => setSpeed(e.data));
      launchEvtRef.current.addEventListener('estimated', (e: MessageEvent) => setEstimated(e.data));
      launchEvtRef.current.addEventListener('extract', (e: MessageEvent) => setExtract(e.data));
      launchEvtRef.current.addEventListener('patch', (e: MessageEvent) => setPatch(e.data));
      launchEvtRef.current.addEventListener('close', () => {
        setIsDownloading(false);
        setIsRunning(false);
        cleanupConnection();
      });
      launchEvtRef.current.addEventListener('cancelled', () => {
        setIsDownloading(false);
        setIsRunning(false);
        cleanupConnection();
      });
      launchEvtRef.current.addEventListener('error', (e) => {
        console.error('Launch SSE error', e);
        setIsDownloading(false);
        setIsRunning(false);
        cleanupConnection();
      });
    },
    [cleanupConnection],
  );

  const cancel = useCallback(
    (id: string) => {
      instanceCancel(id);
      setIsRunning(false);
      setIsDownloading(false);
      setProgress(undefined);
      setLogs((prev) => [...prev, 'Launch cancelled.']);
      setSpeed('');
      setEstimated('');
      setExtract('');
      setPatch('');
      cleanupConnection();
    },
    [cleanupConnection],
  );

  useEffect(() => {
    return () => {
      cleanupConnection();
    };
  }, [cleanupConnection]);

  return {
    launch,
    cancel,
    isDownloading,
    progress,
    logs,
    speed,
    estimated,
    extract,
    patch,
    isRunning,
  };
}

export function useInstanceGetContentsQuery(params: InstanceContentQueryDto) {
  return useQuery({
    queryKey: ['contents', params],
    queryFn: () => instanceGetContents(params),
    enabled: !!params.id && !!params.contentType,
  });
}

export function useInstanceAddContentSSE() {
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState<number | undefined>(undefined);
  const [speed, setSpeed] = useState('');
  const [estimated, setEstimated] = useState('');
  const [isDone, setIsDone] = useState(false);
  const evtRef = useRef<EventSource | null>(null);

  const addContent = useCallback((params: InstanceContentAddQueryDto) => {
    if (evtRef.current) return;
    evtRef.current = instanceAddContent(params);

    setIsDownloading(true);
    setProgress(undefined);
    setSpeed('');
    setEstimated('');
    setIsDone(false);

    evtRef.current.addEventListener('progress', (e) => setProgress(parseFloat(e.data)));
    evtRef.current.addEventListener('speed', (e) => setSpeed(e.data));
    evtRef.current.addEventListener('estimated', (e) => setEstimated(e.data));
    evtRef.current.addEventListener('done', () => {
      setIsDownloading(false);
      setProgress(100);
      setIsDone(true);
      evtRef?.current?.close();
    });
    evtRef.current.addEventListener('error', () => {
      setIsDownloading(false);
      toast.error('Failed to install. Please try again.');
      evtRef?.current?.close();
      evtRef.current = null;
    });
  }, []);

  useEffect(() => {
    return () => evtRef.current?.close();
  }, []);

  return { addContent, isDownloading, progress, speed, estimated, isDone };
}

export function useInstanceRemoveContentMutation() {
  return useMutation({
    mutationFn: instanceRemoveContent,
  });
}

export function useInstanceToggleContentMutation() {
  return useMutation({
    mutationFn: instanceToggleContent,
  });
}
