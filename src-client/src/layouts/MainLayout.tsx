import { useEffect } from 'react';
import { Outlet } from 'react-router';

import { ContainerProvider } from '~/context/ContainerContext';
import { useUpdater } from '~/hooks/app/useUpdater';

import SplashScreen from './SplashScreen';

const isTauri = window.isTauri;

export default function MainLayout() {
  const width = 1150 / window.devicePixelRatio;
  const height = 650 / window.devicePixelRatio;

  const { checkForUpdates, isUpdating, progress } = useUpdater();

  const isLoaded = !isUpdating;

  useEffect(() => {
    if (isTauri) checkForUpdates();
  }, []);

  return (
    <ContainerProvider>
      <div
        id="layout"
        className="flex flex-col bg-base-200"
        style={{ width: isTauri ? '100vw' : `${width}px`, height: isTauri ? '100vh' : `${height}px` }}
      >
        {!isLoaded ? (
          <SplashScreen progress={progress} />
        ) : (
          <>
            <main className="flex-1">
              <Outlet />
            </main>
          </>
        )}
      </div>
    </ContainerProvider>
  );
}
