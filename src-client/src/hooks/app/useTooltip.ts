import { useContext } from 'react';

import { TooltipContext } from '~/context/TooltipContext';

export function useTooltipContext() {
  const ctx = useContext(TooltipContext);
  if (!ctx) throw new Error('useTooltipContext must be used inside TooltipProvider');
  return ctx;
}
