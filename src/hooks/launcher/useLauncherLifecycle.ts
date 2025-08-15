import { useCallback, useState } from 'react';

import { useWS } from '../useWS';

export function useLauncherLifecycle() {
  const { send, on } = useWS();
  const [isPlaying, setIsPlaying] = useState(false);

  const launch = useCallback(() => {
    send('launcher:launch');
    setIsPlaying(true);
  }, [send]);

  const cancel = useCallback(() => {
    send('launcher:cancel');
    setIsPlaying(false);
  }, [send]);

  on('launcher:close', () => setIsPlaying(false));
  on('launcher:error', () => setIsPlaying(false));
  on('launcher:cancelled', () => setIsPlaying(false));

  return { isPlaying, launch, cancel };
}
