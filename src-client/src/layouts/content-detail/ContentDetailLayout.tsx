import { Outlet, useNavigate, useParams } from 'react-router';

import { useFindOneContentQuery } from '~/hooks/api/useContent';
import { useContainer } from '~/hooks/app/useContainer';

import ContentDetailLayoutHeader from './ContentDetailLayoutHeader';
import ContentDetailLayoutSidebar from './ContentDetailLayoutSidebar';
import ContentDetailLayoutTabs from './ContentDetailLayoutTabs';

export default function ContentDetailLayout() {
  const { id } = useParams<{ id: string }>();
  const { height, isReady } = useContainer();

  const navigate = useNavigate();

  const { data } = useFindOneContentQuery(Number(id));

  return (
    <div className="flex gap-4 p-4" style={{ height: isReady ? height : '0px' }}>
      <div className="flex-1 flex flex-col gap-2">
        <ContentDetailLayoutHeader content={data} />
        <ContentDetailLayoutTabs content={data} />

        <div className="flex-1 bg-base-100 rounded overflow-auto">
          <Outlet />
        </div>
      </div>

      <ContentDetailLayoutSidebar content={data} onBack={() => navigate(-1)} />
    </div>
  );
}
