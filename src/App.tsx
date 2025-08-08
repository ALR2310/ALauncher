import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { BrowserRouter, Outlet, Route, Routes } from 'react-router-dom';

import DockNav from './components/layouts/DockNav';
import HomePage from './pages/home/HomePage';
import { checkForAppUpdates } from './services/updater';

const isTauri = '__TAURI__' in window;

function Layout() {
  return (
    <div className="w-[1100px] h-[650px] flex flex-col bg-base-200">
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
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
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
