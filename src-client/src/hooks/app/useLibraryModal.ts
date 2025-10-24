import { useContext } from 'react';

import { LibraryModalContext } from '~/context/LibraryModalContext';

export function useLibraryModal() {
  const context = useContext(LibraryModalContext);
  if (!context) throw new Error('useLibraryModal must be used within a LibraryModalProvider');
  return context;
}
