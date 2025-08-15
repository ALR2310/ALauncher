import { useState } from 'react';

import { useWS } from '../useWS';

const LOG_LIMIT = 5000;

export function useLauncherLogs() {
  const { on } = useWS();
  const [logs, setLogs] = useState<string[]>([]);

  on('launcher:log', (line) => {
    setLogs((prev) =>
      prev.length > LOG_LIMIT ? [...prev.slice(-Math.floor(LOG_LIMIT * 0.8)), line] : [...prev, line],
    );
  });

  const clearLogs = () => setLogs([]);

  return { logs, clearLogs };
}
