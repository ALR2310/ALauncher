import { InstanceContentAddQueryDto, InstanceContentQueryDto, InstanceQueryDto } from '@shared/dtos/instance.dto';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';

import { FetchEventSource } from '~/api';
import {
  instanceAddContent,
  instanceCreate,
  instanceDelete,
  instanceFindAll,
  instanceFindOne,
  instanceFindWorlds,
  instanceGetContents,
  instanceRemoveContent,
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
  const evtRef = useRef<FetchEventSource | null>(null);

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
