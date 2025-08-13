import { useContext, useEffect } from 'react';

import { Handler, WSContext } from '~/providers/WebSocketProvider';

export function useWS() {
  const context = useContext(WSContext);
  if (!context) throw new Error('useWS must be used within WebSocketProvider');
  const { send, on } = context;

  const useWSAction = (action: string, handler: Handler) => {
    useEffect(() => {
      const off = on(action, handler);
      return off;
    }, [action, handler]);
  };

  return { send, on: useWSAction };
}
