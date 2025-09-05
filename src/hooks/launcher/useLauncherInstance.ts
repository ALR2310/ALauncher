import { Instance } from '@shared/schema/instance.schema';
import { useMutation, useQuery } from '@tanstack/react-query';

import api from '~/configs/axios';

export const useLauncherInstance = () => {
  const getAllInstanceQuery = useQuery({
    queryKey: ['instances'],
    queryFn: async () => {
      const res = await api.get('/instance');
      return res.data as Instance[];
    },
  });

  const getInstanceQuery = (id: string) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useQuery({
      queryKey: ['instance', id],
      queryFn: async () => {
        const res = await api.get(`/instance/${id}`);
        return res.data as Instance;
      },
      enabled: !!id,
    });

  const createInstanceMutation = useMutation({
    mutationFn: async (instance: Instance) => {
      const res = await api.post('/instance', instance);
      return res.data as Instance;
    },
  });

  const updateInstanceMutation = useMutation({
    mutationFn: async (instance: Instance) => {
      const res = await api.put(`/instance/${instance.id}`, instance);
      return res.data as Instance;
    },
  });

  const deleteInstanceMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/instance/${id}`);
      return res.data as Instance;
    },
  });

  return {
    getAllInstanceQuery,
    getInstanceQuery,
    createInstanceMutation,
    updateInstanceMutation,
    deleteInstanceMutation,
  };
};
