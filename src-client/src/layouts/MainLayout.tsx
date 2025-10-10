import { useEffect } from 'react';
import { Outlet } from 'react-router';

import { ContainerProvider } from '~/context/ContainerContext';
import { useUpdater } from '~/hooks/app/useUpdater';

import SideBar from './SideBar';
import SplashScreen from './SplashScreen';
import TitleBar from './TitleBar';

const isTauri = window.isTauri;

export default function MainLayout() {
  const width = 1150 / window.devicePixelRatio;
  const height = 650 / window.devicePixelRatio;

  const { checkForUpdates, isUpdating, progress } = useUpdater();

  const isLoaded = !isUpdating;

  useEffect(() => {
    if (isTauri && import.meta.env.MODE !== 'development') checkForUpdates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ContainerProvider>
      <div
        id="layout"
        className="flex flex-col"
        style={{ width: isTauri ? '100vw' : `${width}px`, height: isTauri ? '100vh' : `${height}px` }}
      >
        <TitleBar />
        {!isLoaded ? (
          <SplashScreen progress={progress} />
        ) : (
          <div className="flex-1 flex bg-base-200">
            <SideBar />
            <main className="flex-1 border border-base-content/10 rounded-tl-2xl bg-base-300">
              <Outlet />
            </main>
          </div>
        )}
      </div>
    </ContainerProvider>
  );
}
