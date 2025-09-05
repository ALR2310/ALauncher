import { useContext } from 'react';

import { ContentHeightContext } from '~/providers/ContentHeightProvider';

export function useContentHeight() {
  const context = useContext(ContentHeightContext);
  if (!context) throw new Error('useContentHeight must be used within a ContentHeightProvider');
  return context;
}
