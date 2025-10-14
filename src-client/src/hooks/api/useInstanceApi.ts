import { InstanceContentAddQueryDto, InstanceContentRemoveQueryDto, InstanceQueryDto } from '@shared/dtos/instance.dto';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  instanceAddContent,
  instanceCreate,
  instanceDelete,
  instanceFindAll,
  instanceFindOne,
  instanceFindWorlds,
  instanceLaunch,
  instanceRemoveContent,
  instanceStop,
  instanceToggleContent,
  instanceUpdate,
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

export function useInstanceLaunchSSE() {
  const [progress, setProgress] = useState<number | undefined>(undefined);
  const [logs, setLogs] = useState<string[]>([]);
  const [speed, setSpeed] = useState('');
  const [estimated, setEstimated] = useState('');
  const [extract, setExtract] = useState('');
  const [patch, setPatch] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);

  const launchEvtRef = useRef<EventSource | null>(null);

  const launch = useCallback((id: string) => {
    if (launchEvtRef.current) return;
    launchEvtRef.current = instanceLaunch(id);

    setIsDownloading(false);
    setProgress(undefined);
    setLogs([]);
    setSpeed('');
    setEstimated('');
    setExtract('');
    setPatch('');

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
      launchEvtRef.current?.close();
      launchEvtRef.current = null;
    });
    launchEvtRef.current?.addEventListener('cancelled', () => {
      setIsDownloading(false);
      launchEvtRef.current?.close();
      launchEvtRef.current = null;
    });
    launchEvtRef.current?.addEventListener('error', (e) => {
      console.error('Launch SSE error', e);
      setIsDownloading(false);
      launchEvtRef.current?.close();
      launchEvtRef.current = null;
    });
  }, []);

  const cancel = useCallback((id: string) => {
    instanceStop(id);

    setIsDownloading(false);
    setProgress(undefined);
    setLogs((prev) => [...prev, 'Launch cancelled.']);
    setSpeed('');
    setEstimated('');
    setExtract('');
    setPatch('');

    launchEvtRef.current?.close();
    launchEvtRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      launchEvtRef.current?.close();
      launchEvtRef.current = null;
    };
  }, []);

  return { launch, cancel, isDownloading, progress, logs, speed, estimated, extract, patch };
}

export function useInstanceAddContentSSE() {
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState<number | undefined>(undefined);
  const evtRef = useRef<EventSource | null>(null);

  const addContent = useCallback((params: InstanceContentAddQueryDto) => {
    if (evtRef.current) return;
    evtRef.current = instanceAddContent(params);

    setIsDownloading(true);
    setProgress(undefined);

    evtRef.current.addEventListener('progress', (e) => {
      setProgress(parseFloat(e.data));
    });
    evtRef.current.addEventListener('done', () => {
      setIsDownloading(false);
      setProgress(100);
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

  return { addContent, isDownloading, progress };
}

export function useInstanceRemoveContentMutation(params: InstanceContentRemoveQueryDto) {
  return useMutation({
    mutationKey: ['instanceRemoveContent', params],
    mutationFn: instanceRemoveContent,
  });
}

export function useInstanceToggleContentMutation() {
  return useMutation({
    mutationFn: instanceToggleContent,
  });
}
