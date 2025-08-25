import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { BrowserRouter, Outlet, Route, Routes, useLocation } from 'react-router-dom';

import DockNav from './components/layouts/DockNav';
import Sidebar from './components/layouts/Sidebar';
import BrowserModPage from './pages/BrowserModPage';
import ManagerPage from './pages/ManagerPage';
import ReleaseNotePage from './pages/ReleaseNotePage';
import { ConfirmProvider } from './providers/ConfirmProvider';
import { ToastProvider } from './providers/ToastProvider';
import { checkForAppUpdates } from './services/updater';

const isTauri = '__TAURI__' in window;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  },
});

function Layout() {
  const location = useLocation();

  return (
    <div id="layout" className="w-[1100px] h-[650px] flex flex-col bg-base-200">
      <div className="flex-1 flex flex-nowrap">
        {location.pathname === '/' && <Sidebar className="flex-1/5 bg-base-100" />}
        <main className="flex-4/5">
          <Outlet />
        </main>
      </div>
      <DockNav />
    </div>
  );
}

export default function App() {
  useEffect(() => {
    if (isTauri) checkForAppUpdates();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <ConfirmProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<ReleaseNotePage />} />
                <Route path="manager" element={<ManagerPage />} />
                <Route path="browser">
                  <Route path="mods" element={<BrowserModPage />} />
                </Route>
              </Route>
            </Routes>
          </BrowserRouter>
        </ConfirmProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}
