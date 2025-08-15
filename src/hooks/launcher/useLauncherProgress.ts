import { useState } from 'react';

import { useWS } from '../useWS';

export function useLauncherProgress() {
  const { on } = useWS();
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState('');
  const [estimated, setEstimated] = useState('');

  on('launcher:progress', (value) => setProgress(Number(value)));
  on('launcher:speed', (value) => setSpeed(value));
  on('launcher:estimated', (value) => setEstimated(value));
  on('launcher:extract', (value) => console.log('Extracting:', value));
  on('launcher:patch', (value) => console.log('Patching:', value));

  return { progress, speed, estimated };
}
