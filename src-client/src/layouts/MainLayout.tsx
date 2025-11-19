import { ENV } from '@shared/enums/general.enum';
import { useEffect, useRef } from 'react';
import { Outlet } from 'react-router';

import { ContainerProvider } from '~/context/ContainerContext';
import { DiscoverProvider } from '~/context/DiscoverContext';
import { LibraryProvider } from '~/context/LibraryContext';
import SettingPage from '~/features/setting/SettingPage';
import { useAppGetConfigQuery } from '~/hooks/api/useAppApi';
import { useInstancesCloudQuery, useInstancesQuery } from '~/hooks/api/useInstanceApi';
import { useVersionNotesQuery } from '~/hooks/api/useVersionApi';
import { useUpdater } from '~/hooks/app/useUpdater';

import Sidebar from './Sidebar';
import SplashScreen from './SplashScreen';
import TitleBar from './TitleBar';

const isTauri = window.isTauri;

export default function MainLayout() {
  const width = 1200 / window.devicePixelRatio;
  const height = 700 / window.devicePixelRatio;
  const drawerToggleRef = useRef<HTMLInputElement>(null);

  const { checkForUpdates, isUpdating, progress } = useUpdater();
  const { data: appConfig } = useAppGetConfigQuery();
  const { isLoading: isAppLoading } = useAppGetConfigQuery();
  const { isLoading: isInstanceLoading } = useInstancesQuery();
  const { isLoading: isNoteLoading } = useVersionNotesQuery();
  const { isLoading: isInstanceCloudLoading } = useInstancesCloudQuery();

  const isLoaded = !isUpdating && !isAppLoading && !isInstanceLoading && !isNoteLoading && !isInstanceCloudLoading;

  useEffect(() => {
    const isDev = import.meta.env.MODE === ENV.Development;
    const allowUpdate = appConfig?.autoUpdate ?? false;

    if (isTauri && !isDev && allowUpdate) checkForUpdates();
  }, [appConfig?.autoUpdate, checkForUpdates]);

  const openSettings = () => {
    if (drawerToggleRef.current) {
      drawerToggleRef.current.checked = true;
    }
  };

  return (
    <ContainerProvider>
      <DiscoverProvider>
        <LibraryProvider>
          <div
            id="layout"
            className="flex flex-col min-h-0 drawer"
            style={{ width: isTauri ? '100vw' : `${width}px`, height: isTauri ? '100vh' : `${height}px` }}
          >
            <input id="settings-drawer" type="checkbox" className="drawer-toggle" ref={drawerToggleRef} />
            <div className="drawer-content flex-1 flex flex-col min-h-0">
              <TitleBar />
              {!isLoaded ? (
                <SplashScreen progress={progress} />
              ) : (
                <div className="flex-1 flex bg-base-200 overflow-hidden">
                  <Sidebar onOpenSettings={openSettings} />
                  <main className="flex-1 border border-base-content/10 rounded-tl-2xl bg-base-300 ">
                    <Outlet />
                  </main>
                </div>
              )}
            </div>
            <div className="drawer-side z-40">
              <label htmlFor="settings-drawer" aria-label="close sidebar" className="drawer-overlay"></label>
              <SettingPage />
            </div>
          </div>
        </LibraryProvider>
      </DiscoverProvider>
    </ContainerProvider>
  );
}
