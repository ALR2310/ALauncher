import { Outlet } from 'react-router';

import { useContainer } from '~/hooks/app/useContainer';
import SideRightBar from '~/layouts/SideRightBar';

export default function LibraryLayout() {
  const { height, width } = useContainer();

  return (
    <div className="flex" style={{ height, width }}>
      <div className="flex-1 flex flex-col">
        <Outlet />
      </div>

      <SideRightBar />
    </div>
  );
}
