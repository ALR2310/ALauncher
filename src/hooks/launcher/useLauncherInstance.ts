import { InstanceDto } from '@shared/dtos/instance.dto';
import { useMutation, useQuery } from '@tanstack/react-query';

import api from '~/configs/axios';

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
        const res = await api.get(`/instances/${id}`);
        return res.data as InstanceDto;
      },
      enabled: !!id,
    });

  const createInstanceMutation = useMutation({
    mutationFn: async (instance: InstanceDto) => {
      const res = await api.post('/instances', instance);
      return res.data as InstanceDto;
    },
  });

  const updateInstanceMutation = useMutation({
    mutationFn: async (instance: InstanceDto) => {
      const res = await api.put(`/instances/${instance.id}`, instance);
      return res.data as InstanceDto;
    },
  });

  const deleteInstanceMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/instances/${id}`);
      return res.data as InstanceDto;
    },
  });

  return {
    findAllInstanceQuery,
    findOneInstanceQuery,
    createInstanceMutation,
    updateInstanceMutation,
    deleteInstanceMutation,
  };
};
