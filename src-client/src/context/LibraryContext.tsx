import { useQueryClient } from '@tanstack/react-query';
import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { createContext } from 'use-context-selector';

import { FetchEventSource, instanceCancel, instanceLaunch } from '~/api';
import { useInstanceCloudSyncMutation } from '~/hooks/api/useInstanceApi';
import { useWindow } from '~/hooks/app/useWindow';

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
  isUpdating?: boolean;
}

interface LibraryContextType {
  getState: (id: string) => InstanceLaunchState | undefined;
  launch: (id: string) => void;
  cancel: (id: string) => void;
  update: (id: string) => void;
}

const LibraryContext = createContext<LibraryContextType>(null!);

const LibraryProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const { mutateAsync: instanceCloudSync } = useInstanceCloudSyncMutation();
  const [instances, setInstances] = useState<Map<string, InstanceLaunchState>>(new Map());
  const refs = useRef<Map<string, FetchEventSource>>(new Map());
  const { hide, show } = useWindow();

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

  const cleanup = useCallback(
    (id: string) => {
      const evt = refs.current.get(id);
      if (evt) {
        evt.close();
        refs.current.delete(id);
      }
      show();
    },
    [show],
  );

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
      evt.addEventListener('log', (e) => {
        updateState(id, (prev) => ({
          logs: [...(prev.logs ?? []).slice(-499), e.data],
          isDownloading: false,
          progress: undefined,
        }));

        // Hidden app
        hide();
      });
      evt.addEventListener('speed', (e) => updateState(id, { speed: e.data }));
      evt.addEventListener('estimated', (e) => updateState(id, { estimated: e.data }));
      evt.addEventListener('extract', (e) => updateState(id, { extract: e.data }));
      evt.addEventListener('patch', (e) => updateState(id, { patch: e.data }));
      evt.addEventListener('close', () => {
        updateState(id, { isRunning: false, isDownloading: false });
        cleanup(id);
      });
      evt.addEventListener('error', (e) => {
        console.error('Launch SSE error', e);
        updateState(id, { isRunning: false, isDownloading: false });
        cleanup(id);
      });
    },
    [cleanup, hide, updateState],
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

  const update = useCallback(
    async (id: string) => {
      updateState(id, { isUpdating: true });

      try {
        await instanceCloudSync(id);

        queryClient.invalidateQueries({ queryKey: ['instances'] });
        queryClient.invalidateQueries({ queryKey: ['instance', id] });
        queryClient.invalidateQueries({ queryKey: ['instancesCloud'] });

        launch(id);
      } catch (error) {
        console.log(error);
        toast.error('Failed to update modpack', {});
      } finally {
        updateState(id, { isUpdating: false });
      }
    },
    [instanceCloudSync, launch, queryClient, updateState],
  );

  const ctx = useMemo(() => ({ getState, launch, cancel, update }), [getState, launch, cancel, update]);

  return <LibraryContext.Provider value={ctx}>{children}</LibraryContext.Provider>;
};

export { LibraryContext, LibraryProvider };
export type { InstanceLaunchState, LibraryContextType };
