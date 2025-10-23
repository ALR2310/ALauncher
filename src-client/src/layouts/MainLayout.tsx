import { useEffect } from 'react';
import { Outlet } from 'react-router';

import { ContainerProvider } from '~/context/ContainerContext';
import { DiscoverProvider } from '~/features/discover/context/DiscoverContext';
import { useAppGetConfigQuery } from '~/hooks/api/useAppApi';
import { useInstancesQuery } from '~/hooks/api/useInstanceApi';
import { useVersionNotesQuery, useVersionReleasesQuery } from '~/hooks/api/useVersionApi';
import { useUpdater } from '~/hooks/app/useUpdater';

import Sidebar from './Sidebar';
import SplashScreen from './SplashScreen';
import TitleBar from './TitleBar';

const isTauri = window.isTauri;

export default function MainLayout() {
  const width = 1200 / window.devicePixelRatio;
  const height = 700 / window.devicePixelRatio;

  const { checkForUpdates, isUpdating, progress } = useUpdater();
  const { isLoading: isAppLoading } = useAppGetConfigQuery();
  const { isLoading: isInstanceLoading } = useInstancesQuery();
  const { isLoading: isVersionLoading } = useVersionReleasesQuery();
  const { isLoading: isNoteLoading } = useVersionNotesQuery({});

  const isLoaded = !isUpdating && !isAppLoading && !isInstanceLoading && !isVersionLoading && !isNoteLoading;

  useEffect(() => {
    if (isTauri && import.meta.env.MODE !== 'development') checkForUpdates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ContainerProvider>
      <DiscoverProvider>
        <div
          id="layout"
          className="flex flex-col min-h-0"
          style={{ width: isTauri ? '100vw' : `${width}px`, height: isTauri ? '100vh' : `${height}px` }}
        >
          <TitleBar />
          {!isLoaded ? (
            <SplashScreen progress={progress} />
          ) : (
            <div className="flex-1 flex bg-base-200 overflow-hidden">
              <Sidebar />
              <main className="flex-1 border border-base-content/10 rounded-tl-2xl bg-base-300 ">
                <Outlet />
              </main>
            </div>
          )}
        </div>
      </DiscoverProvider>
    </ContainerProvider>
  );
}
