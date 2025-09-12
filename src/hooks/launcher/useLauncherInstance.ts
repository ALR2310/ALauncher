import { ContentResponseDto } from '@shared/dtos/content.dto';
import { InstanceDto, RemoveContentInstanceDto, ToggleContentInstanceDto } from '@shared/dtos/instance.dto';
import { useMutation, useQuery } from '@tanstack/react-query';

import api from '~/configs/axios';

const BASE_PATH = '/instances';

export const useLauncherInstance = () => {
  const findAllInstanceQuery = useQuery({
    queryKey: ['instances'],
    queryFn: async () => {
      const res = await api.get('/instances');
      return res.data as InstanceDto[];
    },
  });

  const findOneInstanceQuery = (id: string) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useQuery({
      queryKey: ['instance', id],
      queryFn: async () => {
        const res = await api.get(`${BASE_PATH}/${id}`);
        return res.data as InstanceDto;
      },
      enabled: !!id,
    });

  const createInstanceMutation = useMutation({
    mutationFn: async (instance: InstanceDto) => {
      const res = await api.post(`${BASE_PATH}`, instance);
      return res.data as InstanceDto;
    },
  });

  const updateInstanceMutation = useMutation({
    mutationFn: async (instance: InstanceDto) => {
      const res = await api.put(`${BASE_PATH}/${instance.id}`, instance);
      return res.data as InstanceDto;
    },
  });

  const deleteInstanceMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`${BASE_PATH}/${id}`);
      return res.data as InstanceDto;
    },
  });

  const findContentInstanceQuery = (instanceId: string, type: string) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useQuery({
      queryKey: ['instance-contents', instanceId, type],
      queryFn: async () => {
        const res = await api.get(`${BASE_PATH}/${instanceId}/${type}`);
        return res.data as ContentResponseDto;
      },
      enabled: !!instanceId && !!type,
    });
  };

  const removeContentInstanceMutation = useMutation({
    mutationFn: async ({ id, type, contentId }: RemoveContentInstanceDto) => {
      const res = await api.delete(`${BASE_PATH}/${id}/${type}/${contentId}`);
      return res.data as InstanceDto;
    },
  });

  const canRemoveContentInstanceMutation = useMutation({
    mutationFn: async ({ id, type, contentId }: RemoveContentInstanceDto) => {
      const res = await api.get(`${BASE_PATH}/${id}/${type}/${contentId}/can-remove`);
      return res.data as { canRemove: boolean; message: string; dependents: string[] };
    },
  });

  const toggleContentInstanceMutation = useMutation({
    mutationFn: async ({ id, type, contentIds, enabled }: ToggleContentInstanceDto) => {
      const res = await api.post(`${BASE_PATH}/${id}/${type}/toggle`, { contentIds, enabled });
      return res.data as InstanceDto;
    },
  });

  return {
    findAllInstanceQuery,
    findOneInstanceQuery,
    createInstanceMutation,
    updateInstanceMutation,
    deleteInstanceMutation,
    findContentInstanceQuery,
    removeContentInstanceMutation,
    canRemoveContentInstanceMutation,
    toggleContentInstanceMutation,
  };
};
