import { useContext } from 'react';

import { SelectInstanceContext } from '~/context/SelectInstanceContext';

export function useSelectInstance() {
  const ctx = useContext(SelectInstanceContext);
  if (!ctx) throw new Error('useSelectInstance must be used within a SelectInstanceProvider');
  return ctx;
}
