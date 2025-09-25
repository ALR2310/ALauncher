import { useContext } from 'react';

import { ContainerContext } from '~/context/ContainerContext';

export function useContainer() {
  const context = useContext(ContainerContext);
  if (!context) throw new Error('useContentHeight must be used within a ContentHeightProvider');
  return context;
}
