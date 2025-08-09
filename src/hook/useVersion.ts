import { useContext } from 'react';

import { VersionContext } from '~/providers/VersionProvider';

export const useVersion = () => {
  const context = useContext(VersionContext);
  if (!context) throw new Error('useVersion is not initialized yet');
  return context;
};
