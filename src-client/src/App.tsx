import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { BrowserRouter, Outlet, Route, Routes } from 'react-router';
import { useContextSelector } from 'use-context-selector';

import DockNav from './components/layouts/DockNav';
import { useUpdater } from './hooks/useUpdater';
import BrowsePage from './pages/browse/BrowsePage';
import HomePage from './pages/home/HomePage';
import LoadingPage from './pages/LoadingPage';
import ManagerPage from './pages/manager/ManagerPage';
import { ConfirmProvider } from './providers/ConfirmProvider';
import { ContentHeightProvider } from './providers/ContentHeightProvider';
import { LauncherContext, LauncherProvider } from './providers/LauncherProvider';
import { ToastProvider } from './providers/ToastProvider';

const isTauri = window.isTauri;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: 1,
      staleTime: Infinity,
    },
  },
});

function Layout() {
  const width = 1150 / window.devicePixelRatio;
  const height = 650 / window.devicePixelRatio;

  const { checkForUpdates, isUpdating, progress } = useUpdater();

  useEffect(() => {
    checkForUpdates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  console.log(progress);

  const findReleaseNotesQuery = useContextSelector(LauncherContext, (v) => v.findReleaseNotesQuery);
  const findAllVersionQuery = useContextSelector(LauncherContext, (v) => v.findAllVersionQuery);
  const findAllInstanceQuery = useContextSelector(LauncherContext, (v) => v.findAllInstanceQuery);

  const queries = [findReleaseNotesQuery, findAllVersionQuery, findAllInstanceQuery];

  const isError = queries.some((q) => q.isError);
  const isSuccess = queries.every((q) => q.isSuccess);
  const isLoaded = isSuccess && !isError && !isUpdating;

  return (
    <ContentHeightProvider>
      <div
        id="layout"
        className="flex flex-col bg-base-200"
        style={{ width: isTauri ? '100vw' : `${width}px`, height: isTauri ? '100vh' : `${height}px` }}
      >
        {!isLoaded ? (
          <LoadingPage progress={progress} />
        ) : (
          <>
            <main className="flex-1">
              <Outlet />
            </main>
            <DockNav />
          </>
        )}
      </div>
    </ContentHeightProvider>
  );
}

export default function App() {
  useEffect(() => {
    if (isTauri) {
      const handler = (e: MouseEvent) => e.preventDefault();
      document.addEventListener('contextmenu', handler);
      return () => document.removeEventListener('contextmenu', handler);
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <ConfirmProvider>
          <LauncherProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Layout />}>
                  <Route index element={<HomePage />} />
                  <Route path="/manager/:instanceId" element={<ManagerPage />} />
                  <Route path="/browse/:instanceId" element={<BrowsePage />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </LauncherProvider>
        </ConfirmProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}
