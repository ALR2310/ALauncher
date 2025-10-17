import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router';

import { ROUTES } from './constants/routes';
import { ConfirmProvider } from './context/ConfirmContext';
import { LibraryModalProvider } from './context/LibraryModalContext';
import { ToastProvider } from './context/ToastContext';
import DiscoverDetailPage from './features/discover/DiscoverDetailPage';
import DiscoverPage from './features/discover/DiscoverPage';
import DiscoverLayout from './features/discover/layouts/DiscoverLayout';
import HomePage from './features/home/HomePage';
import LibraryLayout from './features/library/layouts/LibraryLayout';
import LibraryDetailPage from './features/library/LibraryDetailPage';
import LibraryPage from './features/library/LibraryPage';
import MainLayout from './layouts/MainLayout';

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
          <LibraryModalProvider>
            <BrowserRouter>
              <Routes>
                <Route path={ROUTES.ROOT} element={<MainLayout />}>
                  <Route index element={<HomePage />} />
                  <Route path={ROUTES.LIBRARY} element={<LibraryLayout />}>
                    <Route index element={<LibraryPage />} />
                    <Route path=":id" element={<LibraryDetailPage />} />
                  </Route>
                  <Route path={ROUTES.DISCOVER} element={<DiscoverLayout />}>
                    <Route index element={<DiscoverPage />} />
                    <Route path=":id" element={<DiscoverDetailPage />} />
                  </Route>
                </Route>
              </Routes>
            </BrowserRouter>
          </LibraryModalProvider>
        </ConfirmProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}
