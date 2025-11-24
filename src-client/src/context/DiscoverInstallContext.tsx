import { InstanceContentAddQueryDto } from '@shared/dtos/instance.dto';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createContext } from 'use-context-selector';

import { FetchEventSource, instanceAddContent } from '~/api';

interface DiscoverInstallState {
  isDownloading: boolean;
  progress: number | undefined;
  estimated: string;
  speed: string;
  isDone: boolean;
}

type DiscoverInstallContextType = {
  addContent(params: InstanceContentAddQueryDto): Promise<void>;
  getState(contentId: number): DiscoverInstallState | undefined;
};

const DiscoverInstallContext = createContext<DiscoverInstallContextType>(null!);

const DiscoverInstallProvider = ({ children }: { children: React.ReactNode }) => {
  const queryClient = useQueryClient();
  const [contents, setContents] = useState<Map<number, DiscoverInstallState>>(new Map());
  const [, setDownloadCount] = useState(0);
  const refs = useRef<Map<number, FetchEventSource>>(new Map());

  const updateState = useCallback((id: number, patch: Partial<DiscoverInstallState>) => {
    setContents((prev) => {
      const newMap = new Map(prev);
      const base: DiscoverInstallState = newMap.get(id) || {
        isDownloading: false,
        progress: undefined,
        estimated: '',
        speed: '',
        isDone: false,
      };
      newMap.set(id, { ...base, ...patch });
      return newMap;
    });
  }, []);

  const cleanup = useCallback((id: number) => {
    const evt = refs.current.get(id);
    if (evt) {
      evt.close();
      refs.current.delete(id);
    }
  }, []);

  const addContent = useCallback(
    async (params: InstanceContentAddQueryDto) => {
      if (refs.current.has(params.contentId)) return;

      setDownloadCount((prev) => prev + 1);

      updateState(params.contentId, {
        isDownloading: true,
        isDone: false,
        progress: undefined,
        estimated: '',
        speed: '',
      });

      const evt = instanceAddContent(params);
      refs.current.set(params.contentId, evt);

      evt.addEventListener('progress', (e) => updateState(params.contentId, { progress: parseFloat(e.data) }));
      evt.addEventListener('speed', (e) => updateState(params.contentId, { speed: e.data }));
      evt.addEventListener('estimated', (e) => updateState(params.contentId, { estimated: e.data }));
      evt.addEventListener('done', () => {
        updateState(params.contentId, { isDownloading: false, isDone: true, progress: 100 });
        cleanup(params.contentId);

        setDownloadCount((prev) => {
          const newCount = prev - 1;
          if (newCount === 0) {
            queryClient.invalidateQueries({ queryKey: ['contents'] });
          }
          return newCount;
        });
      });
      evt.addEventListener('error', (e) => {
        console.error('Add content SSE error', e);
        updateState(params.contentId, { isDownloading: false });
        cleanup(params.contentId);

        setDownloadCount((prev) => {
          const newCount = prev - 1;
          if (newCount === 0) {
            queryClient.invalidateQueries({ queryKey: ['contents'] });
          }
          return newCount;
        });
      });
    },
    [updateState, cleanup, queryClient],
  );

  const getState = useCallback(
    (id: number) => {
      return contents.get(id);
    },
    [contents],
  );

  useEffect(() => {
    const localRefs = refs.current;
    return () => {
      localRefs.forEach((evt) => evt.close());
      localRefs.clear();
    };
  }, []);

  const ctx = useMemo(() => ({ addContent, getState }), [addContent, getState]);

  return <DiscoverInstallContext.Provider value={ctx}>{children}</DiscoverInstallContext.Provider>;
};

export { DiscoverInstallContext, DiscoverInstallProvider };
export type { DiscoverInstallContextType, DiscoverInstallState };
