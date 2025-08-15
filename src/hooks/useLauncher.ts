import { useContext } from 'react';

import { LauncherContext } from '~/providers/LauncherProvider';

export const useLauncher = () => {
  const context = useContext(LauncherContext);
  if (!context) throw new Error('useLauncher is not initialized yet');
  return context;
};
