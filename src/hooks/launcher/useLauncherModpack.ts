import { InstanceMeta, InstanceType } from '@shared/launcher.type';
import { useCallback, useEffect, useState } from 'react';

import { useWS } from '../useWS';

export function useLauncherModpack() {
  const { send, on } = useWS();
  const [instances, setInstances] = useState<InstanceType[]>([]);

  // Fetch all instances
  useEffect(() => {
    console.log('Fetching instances...');
    send('instance:getAll');
  }, [send]);
  on('instance:getAll', (data: InstanceType[]) => {
    setInstances(data);
    console.log('Instances fetched:', data);
  });

  // Create a new instance
  const createInstance = useCallback(
    (instance: InstanceMeta) => {
      send('instance:create', instance);
    },
    [send],
  );

  // Update an existing instance
  const updateInstance = useCallback(
    (instance: InstanceMeta) => {
      send('instance:update', instance);
    },
    [send],
  );

  // Delete an instance
  const deleteInstance = useCallback(
    (slug: string) => {
      send('instance:delete', slug);
    },
    [send],
  );

  return { instances, createInstance, updateInstance, deleteInstance };
}
