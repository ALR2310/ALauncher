import { Outlet } from 'react-router';

import { useContainer } from '~/hooks/app/useContainer';

import DiscoverDetailPanel from '../components/DiscoverDetailPanel';

export default function DiscoverDetailLayout() {
  const { height, width } = useContainer();

  return (
    <div className="flex" style={{ height, width }}>
      <Outlet />

      <DiscoverDetailPanel />
    </div>
  );
}
