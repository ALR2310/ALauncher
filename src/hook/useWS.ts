// useWS.ts
import { useContext, useEffect } from 'react';

import { WSContext } from '~/providers/WebSocketProvider';

export function useWS() {
  return useContext(WSContext);
}

export function useWSListener(action: string, handler: (data: any) => void) {
  const { on } = useWS();
  useEffect(() => {
    const cleanup = on(action, handler);
    return cleanup;
  }, [action, handler, on]);
}
