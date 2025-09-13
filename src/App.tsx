import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { BrowserRouter, Outlet, Route, Routes } from 'react-router';

import DockNav from './components/layouts/DockNav';
// import { checkForAppUpdates } from './hooks/useUpdater';
import BrowsePage from './pages/browse/BrowsePage';
import HomePage from './pages/home/HomePage';
import ManagerPage from './pages/manager/ManagerPage';
import { ConfirmProvider } from './providers/ConfirmProvider';
import { ContentHeightProvider } from './providers/ContentHeightProvider';
import { LauncherProvider } from './providers/LauncherProvider';
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
  const realWidth = 1150;
  const realHeight = 650;

  const cssWidth = realWidth / window.devicePixelRatio;
  const cssHeight = realHeight / window.devicePixelRatio;

  return (
    <ContentHeightProvider>
      <div
        id="layout"
        className="flex flex-col bg-base-200"
        style={{ width: isTauri ? '100vw' : `${cssWidth}px`, height: isTauri ? '100vh' : `${cssHeight}px` }}
      >
        <main className="flex-1">
          <Outlet />
        </main>
        <DockNav />
      </div>
    </ContentHeightProvider>
  );
}

export default function App() {
  useEffect(() => {
    if (isTauri) {
      // checkForAppUpdates();

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
