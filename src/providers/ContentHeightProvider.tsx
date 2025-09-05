import { getCurrentWindow } from '@tauri-apps/api/window';
import throttle from 'lodash/throttle';
import { createContext, useEffect, useMemo, useRef, useState } from 'react';

const ContentHeightContext = createContext<{ height: number; isReady: boolean }>({
  height: 0,
  isReady: false,
});

const ContentHeightProvider = ({ children }: { children: React.ReactNode }) => {
  const [height, setHeight] = useState<number>(0);
  const [isReady, setIsReady] = useState(false);

  const updateHeight = throttle(() => {
    const layoutEl = document.getElementById('layout');
    const dockEl = document.getElementById('dockNav');
    if (!layoutEl || !dockEl) return;

    const newHeight = layoutEl.offsetHeight - dockEl.offsetHeight;
    setHeight(newHeight);
    setIsReady(true);
  }, 200);

  useEffect(() => {
    updateHeight();

    if (window.isTauri) {
      const unlistenPromise = getCurrentWindow().onResized(() => {
        updateHeight();
      });
      return () => {
        unlistenPromise.then((unlisten) => unlisten());
      };
    }
  }, [updateHeight]);

  const ctx = useMemo(() => ({ height, isReady }), [height, isReady]);

  return <ContentHeightContext.Provider value={ctx}>{children}</ContentHeightContext.Provider>;
};

export { ContentHeightContext, ContentHeightProvider };
