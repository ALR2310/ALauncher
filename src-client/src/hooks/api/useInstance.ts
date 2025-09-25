import { AddContentInstanceDto } from '@shared/dtos/instance.dto';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  addContentInstance,
  canRemoveContentInstance,
  createInstance,
  deleteInstance,
  findAllInstance,
  findContentInstance,
  findOneInstance,
  removeContentInstance,
  toggleContentInstance,
  updateInstance,
} from '~/api';

import { toast } from '../app/useToast';

export function useFindAllInstanceQuery() {
  return useQuery({
    queryKey: ['instances'],
    queryFn: findAllInstance,
  });
}

export function useFindOneInstanceQuery(id: string) {
  return useQuery({
    queryKey: ['instance', id],
    queryFn: () => findOneInstance(id),
    enabled: !!id,
  });
}

export function useCreateInstanceMutation() {
  return useMutation({
    mutationFn: createInstance,
  });
}

export function useUpdateInstanceMutation() {
  return useMutation({
    mutationFn: updateInstance,
  });
}

export function useDeleteInstanceMutation() {
  return useMutation({
    mutationFn: deleteInstance,
  });
}

export function useFindContentsInstanceQuery(instanceId: string, type: string) {
  return useQuery({
    queryKey: ['instance-contents', instanceId, type],
    queryFn: () => findContentInstance(instanceId, type),
    enabled: !!instanceId && !!type,
    staleTime: 0,
  });
}

export function useAddContentInstanceEvent() {
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState<number | undefined>(undefined);
  const evtRef = useRef<EventSource | null>(null);

  const addContent = useCallback((params: AddContentInstanceDto) => {
    if (evtRef.current) return;
    evtRef.current = addContentInstance(params);
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

export function useRemoveContentInstanceMutation() {
  return useMutation({
    mutationFn: removeContentInstance,
  });
}

export function useCheckRemoveContentInstanceMutation() {
  return useMutation({
    mutationFn: canRemoveContentInstance,
  });
}

export function useToggleContentInstanceMutation() {
  return useMutation({
    mutationFn: toggleContentInstance,
  });
}
