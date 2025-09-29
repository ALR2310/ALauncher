import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router';

import { ConfirmProvider } from './context/ConfirmContext';
import { ToastProvider } from './context/ToastContext';
import ContentDetailLayout from './layouts/content-detail/ContentDetailLayout';
import MainLayout from './layouts/MainLayout';
import ContentPage from './pages/content/ContentPage';
import ContentDetailDescription from './pages/content/detail/ContentDetailDescription';
import ContentDetailFiles from './pages/content/detail/ContentDetailFiles';
import ContentDetailGallery from './pages/content/detail/ContentDetailGallery';
import HomePage from './pages/home/HomePage';
import InstancePage from './pages/instance/InstancePage';

const { isTauri } = window;

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
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<MainLayout />}>
                <Route index element={<HomePage />} />
                <Route path="instances/:id" element={<InstancePage />} />
                <Route path="contents">
                  <Route index element={<ContentPage />} />
                  <Route path=":slug" element={<ContentDetailLayout />}>
                    <Route index element={<ContentDetailDescription />} />
                    <Route path="files" element={<ContentDetailFiles />} />
                    <Route path="gallery" element={<ContentDetailGallery />} />
                  </Route>
                </Route>
              </Route>
            </Routes>
          </BrowserRouter>
        </ConfirmProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}
