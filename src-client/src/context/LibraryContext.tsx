import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { createContext } from 'use-context-selector';

import { instanceCancel, instanceLaunch } from '~/api';

type Patch = Partial<InstanceLaunchState> | ((prev: InstanceLaunchState) => Partial<InstanceLaunchState>);

interface InstanceLaunchState {
  progress?: number;
  logs: string[];
  speed: string;
  estimated: string;
  extract: string;
  patch: string;
  isRunning: boolean;
  isDownloading: boolean;
}

interface LibraryContextType {
  getState: (id: string) => InstanceLaunchState | undefined;
  launch: (id: string) => void;
  cancel: (id: string) => void;
}

const LibraryContext = createContext<LibraryContextType>(null!);

const LibraryProvider = ({ children }: { children: ReactNode }) => {
  const [instances, setInstances] = useState<Map<string, InstanceLaunchState>>(new Map());
  const refs = useRef<Map<string, EventSource>>(new Map());

  const updateState = useCallback((id: string, patch: Patch) => {
    setInstances((prev) => {
      const newMap = new Map(prev);
      const base: InstanceLaunchState = newMap.get(id) ?? {
        logs: [],
        speed: '',
        estimated: '',
        extract: '',
        patch: '',
        isRunning: false,
        isDownloading: false,
        progress: undefined,
      };

      const nextPartial = typeof patch === 'function' ? patch(base) : patch;
      newMap.set(id, { ...base, ...nextPartial });
      return newMap;
    });
  }, []);

  const cleanup = useCallback((id: string) => {
    const evt = refs.current.get(id);
    if (evt) {
      evt.close();
      refs.current.delete(id);
    }
  }, []);

  const launch = useCallback(
    (id: string) => {
      if (refs.current.has(id)) return;
      updateState(id, {
        isRunning: true,
        isDownloading: true,
        progress: undefined,
        logs: [],
        speed: '',
        estimated: '',
        extract: '',
        patch: '',
      });

      const evt = instanceLaunch(id);
      refs.current.set(id, evt);

      evt.addEventListener('progress', (e) => updateState(id, { progress: Number(e.data) }));
      evt.addEventListener('log', (e) =>
        updateState(id, (prev) => ({
          logs: [...(prev.logs ?? []).slice(-499), e.data],
          isDownloading: false,
          progress: undefined,
        })),
      );
      evt.addEventListener('speed', (e) => updateState(id, { speed: e.data }));
      evt.addEventListener('estimated', (e) => updateState(id, { estimated: e.data }));
      evt.addEventListener('extract', (e) => updateState(id, { extract: e.data }));
      evt.addEventListener('patch', (e) => updateState(id, { patch: e.data }));
      evt.addEventListener('close', () => {
        updateState(id, { isRunning: false, isDownloading: false });
        cleanup(id);
      });
      evt.addEventListener('error', () => {
        updateState(id, { isRunning: false, isDownloading: false });
        cleanup(id);
      });
    },
    [cleanup, updateState],
  );

  const cancel = useCallback(
    (id: string) => {
      instanceCancel(id);
      updateState(id, {
        isRunning: false,
        isDownloading: false,
        progress: undefined,
      });
      cleanup(id);
    },
    [cleanup, updateState],
  );

  const getState = useCallback((id: string) => instances.get(id), [instances]);

  useEffect(() => {
    const localRefs = refs.current;
    return () => {
      localRefs.forEach((evt) => evt.close());
      localRefs.clear();
    };
  }, []);

  return <LibraryContext.Provider value={{ getState, launch, cancel }}>{children}</LibraryContext.Provider>;
};

export { LibraryContext, LibraryProvider };
export type { InstanceLaunchState, LibraryContextType };
