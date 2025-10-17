import { Outlet } from 'react-router';

import { DiscoverProvider } from '../context/DiscoverContext';

export default function DiscoverLayout() {
  return (
    <DiscoverProvider>
      <Outlet />
    </DiscoverProvider>
  );
}
