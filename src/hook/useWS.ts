import { useContext, useEffect } from 'react';

import { WSContext } from '~/providers/WebSocketProvider';

export function useWS() {
  const { send, on, off } = useContext(WSContext);

  const useOn = (action: string, handler: (data: any) => void) => {
    useEffect(() => {
      on(action, handler);
      return () => off(action, handler);
    }, [action, handler]);
  };

  return { send, on: useOn };
}
