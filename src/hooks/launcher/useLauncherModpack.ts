import { InstanceMeta, InstanceType } from '@shared/launcher.type';
import { useCallback, useEffect, useState } from 'react';

import { useWS } from '../useWS';

export function useLauncherModpack() {
  const { send, on } = useWS();
  const [instances, setInstances] = useState<InstanceMeta[]>([]);
  const [instance, setInstance] = useState<InstanceType | null>(null);

  const [createInstanceResult, setCreateInstanceResult] = useState<any>(null);
  const [updateInstanceResult, setUpdateInstanceResult] = useState<any>(null);
  const [deleteInstanceResult, setDeleteInstanceResult] = useState<any>(null);

  // Fetch all instances
  useEffect(() => send('instance:getAll'), [send]);
  on('instance:getAll', (data: InstanceType[]) => setInstances(data));

  // Get instance
  const getInstance = useCallback((slug: string) => send('instance:getOne', slug), [send]);
  on('instance:getOne', (data: InstanceType) => setInstance(data));

  // Create a new instance
  const createInstance = useCallback((instance: InstanceMeta) => send('instance:create', instance), [send]);
  on('instance:create', (data: any) => setCreateInstanceResult(data));

  // Update an existing instance
  const updateInstance = useCallback((instance: InstanceMeta) => send('instance:update', instance), [send]);
  on('instance:update', (data: any) => setUpdateInstanceResult(data));

  // Delete an instance
  const deleteInstance = useCallback((slug: string) => send('instance:delete', slug), [send]);
  on('instance:delete', (data: any) => setDeleteInstanceResult(data));

  return {
    instance,
    instances,
    getInstance,
    createInstance,
    createInstanceResult,
    updateInstance,
    updateInstanceResult,
    deleteInstance,
    deleteInstanceResult,
  };
}
