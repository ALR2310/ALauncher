import { InstanceDto } from '@shared/dtos/instance.dto';
import { useMutation, useQuery } from '@tanstack/react-query';

import {
  canRemoveContentInstance,
  createInstance,
  deleteInstance,
  findAllInstance,
  findContentInstance,
  findOneInstance,
  removeContentInstance,
  toggleContentInstance,
  updateInstance,
} from '~/api/instance.api';

export const useLauncherInstance = () => {
  const findAllInstanceQuery = useQuery({
    queryKey: ['instances'],
    queryFn: findAllInstance,
  });

  const findOneInstanceQuery = (id: string) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useQuery({
      queryKey: ['instance', id],
      queryFn: () => findOneInstance(id),
      enabled: !!id,
    });

  const createInstanceMutation = useMutation({
    mutationFn: async (instance: InstanceDto) => createInstance(instance),
  });

  const updateInstanceMutation = useMutation({
    mutationFn: async (instance: InstanceDto) => updateInstance(instance),
  });

  const deleteInstanceMutation = useMutation({
    mutationFn: async (id: string) => deleteInstance(id),
  });

  const findContentInstanceQuery = (instanceId: string, type: string) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useQuery({
      queryKey: ['instance-contents', instanceId, type],
      queryFn: () => findContentInstance(instanceId, type),
      enabled: !!instanceId && !!type,
      staleTime: 0,
    });
  };

  const removeContentInstanceMutation = useMutation({
    mutationFn: removeContentInstance,
  });

  const canRemoveContentInstanceMutation = useMutation({
    mutationFn: canRemoveContentInstance,
  });

  const toggleContentInstanceMutation = useMutation({
    mutationFn: toggleContentInstance,
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
