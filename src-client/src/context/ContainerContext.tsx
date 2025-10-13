import { getCurrentWindow } from '@tauri-apps/api/window';
import throttle from 'lodash/throttle';
import { createContext, useEffect, useMemo, useState } from 'react';

interface ContainerContextType {
  height: number;
  width: number;
  isReady: boolean;
}

const ContainerContext = createContext<ContainerContextType>(null!);

const ContainerProvider = ({ children }: { children: React.ReactNode }) => {
  const [height, setHeight] = useState<number>(0);
  const [width, setWidth] = useState<number>(0);
  const [isReady, setIsReady] = useState(false);

  const updateHeight = throttle(() => {
    const layoutEl = document.getElementById('layout');
    const titleBarEl = document.getElementById('title-bar');
    const sideLeftBarEl = document.getElementById('side-left-bar');
    if (!layoutEl) return;

    const newHeight = titleBarEl ? layoutEl.offsetHeight - titleBarEl.offsetHeight : layoutEl.offsetHeight;
    const newWidth = sideLeftBarEl ? layoutEl.offsetWidth - sideLeftBarEl.offsetWidth : layoutEl.offsetWidth;

    setHeight(newHeight);
    setWidth(newWidth);
    setIsReady(true);
  }, 200);

  useEffect(() => {
    updateHeight();

    if (window.isTauri) {
      const unlistenPromise = getCurrentWindow().onResized(() => updateHeight());
      return () => {
        unlistenPromise.then((unlisten) => unlisten());
      };
    }
  }, [updateHeight]);

  const ctx = useMemo(() => ({ height, width, isReady }), [height, width, isReady]);

  return <ContainerContext.Provider value={ctx}>{children}</ContainerContext.Provider>;
};

export { ContainerContext, ContainerProvider };
