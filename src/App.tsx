import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { BrowserRouter, Outlet, Route, Routes, useLocation } from 'react-router-dom';

import DockNav from './components/layouts/DockNav';
import Sidebar from './components/layouts/Sidebar';
import ManagerModPage from './pages/ManagerModPage';
import ManagerPage from './pages/ManagerPage';
import { LauncherProvider } from './providers/LauncherProvider';
import { ToastProvider } from './providers/ToastProvider';
import { WebSocketProvider } from './providers/WebSocketProvider';
import { checkForAppUpdates } from './services/updater';

const isTauri = '__TAURI__' in window;

function Layout() {
  const location = useLocation();

  return (
    <div className="w-[1100px] h-[650px] flex flex-col bg-base-200">
      <div className="flex-1 flex flex-nowrap">
        {location.pathname === '/' && <Sidebar className="flex-1/5 bg-base-100" />}
        <main className="flex-4/5 overflow-auto">
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
    <QueryClientProvider client={new QueryClient()}>
      <WebSocketProvider>
        <LauncherProvider>
          <ToastProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Layout />}>
                  <Route index element={<ManagerPage />} />
                  <Route path="mods" element={<ManagerModPage />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </ToastProvider>
        </LauncherProvider>
      </WebSocketProvider>
    </QueryClientProvider>
  );
}
