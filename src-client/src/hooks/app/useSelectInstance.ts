import { useContext } from 'react';

import { InstanceFileSelectContext } from '~/context/InstanceFileSelectContext';
import { InstanceSelectContext } from '~/context/InstanceSelectContext';

export function useSelectInstance() {
  const selectCtx = useContext(InstanceSelectContext);
  const fileCtx = useContext(InstanceFileSelectContext);

  if (!selectCtx) throw new Error('useSelectInstance must be used within an InstanceSelectProvider');
  if (!fileCtx) throw new Error('useSelectInstance must be used within an InstanceFileSelectProvider');

  return {
    selectInstance: selectCtx.selectInstance,
    selectInstanceFiles: fileCtx.selectInstanceFiles,
  };
}
