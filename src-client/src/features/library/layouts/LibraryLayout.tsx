import { Outlet } from 'react-router';

import { useContainer } from '~/hooks/app/useContainer';
import InfoPanel from '~/layouts/InfoPanel';

export default function LibraryLayout() {
  const { height, width } = useContainer();

  return (
    <div className="flex" style={{ height, width }}>
      <div className="flex-1 flex flex-col">
        <Outlet />
      </div>

      <InfoPanel />
    </div>
  );
}
