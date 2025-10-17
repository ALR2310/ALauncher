import { Outlet } from 'react-router';

import { ROUTES } from '~/constants/routes';
import { useContainer } from '~/hooks/app/useContainer';

import DiscoverDetailPanel from '../components/DiscoverDetailPanel';
import DiscoverFilterBar from '../components/DiscoverFilterBar';
import { DiscoverProvider } from '../context/DiscoverContext';

export default function DiscoverLayout() {
  const { height, width } = useContainer();

  return (
    <DiscoverProvider>
      <div className="flex" style={{ height, width }}>
        <Outlet />

        {location.pathname === ROUTES.DISCOVER ? <DiscoverFilterBar /> : <DiscoverDetailPanel />}
      </div>
    </DiscoverProvider>
  );
}
