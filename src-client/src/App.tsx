import { ROUTES } from '@shared/constants/routes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router';

import { ConfirmProvider } from './context/ConfirmContext';
import { LibraryModalProvider } from './context/LibraryModalContext';
import { ToastProvider } from './context/ToastContext';
import DiscoverDescription from './features/discover/DiscoverDescription';
import DiscoverFiles from './features/discover/DiscoverFiles';
import DiscoverGallery from './features/discover/DiscoverGallery';
import DiscoverList from './features/discover/DiscoverList';
import DiscoverDetailLayout from './features/discover/layouts/DiscoverDetailLayout';
import HomeView from './features/home/HomeView';
import LibraryLayout from './features/library/layouts/LibraryLayout';
import LibraryDetail from './features/library/LibraryDetail';
import LibraryList from './features/library/LibraryList';
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
                <Route path={ROUTES.root} element={<MainLayout />}>
                  <Route index element={<HomeView />} />
                  <Route path={ROUTES.library.path} element={<LibraryLayout />}>
                    <Route index element={<LibraryList />} />
                    <Route path={ROUTES.library.detail(':id')} element={<LibraryDetail />} />
                  </Route>
                  <Route path={ROUTES.discover.path}>
                    <Route index element={<DiscoverList />} />
                    <Route path={ROUTES.discover.detail(':slug')} element={<DiscoverDetailLayout />}>
                      <Route index element={<DiscoverDescription />} />
                      <Route path={ROUTES.discover.gallery(':slug')} element={<DiscoverGallery />} />
                      <Route path={ROUTES.discover.files(':slug')} element={<DiscoverFiles />} />
                    </Route>
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
