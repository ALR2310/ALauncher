import { InstanceMeta, InstanceType } from '@shared/launcher.type';
import { useMutation, useQuery } from '@tanstack/react-query';

import { api } from '~/configs/axios';

export interface InstanceResponse {
  success: boolean;
  meta?: InstanceMeta;
  filePath?: string;
  message?: string;
}

export type Mod = InstanceType['mods'][number];

export function useLauncherInstances() {
  const instancesQuery = useQuery({
    queryKey: ['launcherInstances'],
    queryFn: async () => {
      const res = await api.get('instances');
      return res.data as InstanceMeta[];
    },
  });

  const instanceDetailQuery = useMutation({
    mutationFn: async (slug: string) => {
      const res = await api.get(`instances`, { params: { slug } });
      return res.data as InstanceType;
    },
  });

  const createInstanceQuery = useMutation({
    mutationFn: async (instance: InstanceMeta) => {
      const res = await api.post('instances', instance);
      return res.data as InstanceResponse;
    },
  });

  const updateInstanceQuery = useMutation({
    mutationFn: async (payload: { slug: string; instance: Partial<InstanceMeta> }) => {
      const res = await api.put(`instances/${payload.slug}`, payload.instance);
      return res.data as InstanceResponse;
    },
  });

  const deleteInstanceQuery = useMutation({
    mutationFn: async (slug: string) => {
      const res = await api.delete(`instances/${slug}`);
      return res.data as Omit<InstanceResponse, 'meta' | 'filePath'>;
    },
  });

  const addModsQuery = useMutation({
    mutationFn: async (payload: { slug: string; mods: Mod[] }) => {
      const res = await api.post(`instances/${payload.slug}/mods`, { mods: payload.mods });
      return res.data as InstanceResponse;
    },
  });

  const removeModsQuery = useMutation({
    mutationFn: async (payload: { slug: string; ids: string[] }) => {
      const res = await api.delete(`instances/${payload.slug}/mods`, { data: { ids: payload.ids } });
      return res.data as InstanceResponse;
    },
  });

  return {
    getInstances: instancesQuery,
    getInstanceDetail: instanceDetailQuery,
    createInstance: createInstanceQuery,
    updateInstance: updateInstanceQuery,
    deleteInstance: deleteInstanceQuery,
    addMods: addModsQuery,
    removeMods: removeModsQuery,
  };
}
