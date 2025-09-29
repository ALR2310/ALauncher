import { Outlet, useParams } from 'react-router';

import { useFindOneContentQuery } from '~/hooks/api/useContent';
import { useContainer } from '~/hooks/app/useContainer';

import ContentDetailLayoutHeader from './ContentDetailLayoutHeader';
import ContentDetailLayoutSidebar from './ContentDetailLayoutSidebar';
import ContentDetailLayoutTabs from './ContentDetailLayoutTabs';

export default function ContentDetailLayout() {
  const { slug } = useParams<{ slug: string }>();
  const { height, isReady } = useContainer();

  const { data } = useFindOneContentQuery(slug!);

  return (
    <div className="flex gap-4 p-4" style={{ height: isReady ? height : '0px' }}>
      {/* 'min-w-0' is required to prevent flex children from overflowing their container. */}
      {/* See: https://css-tricks.com/flexbox-truncated-text/#min-width-0 */}
      <div className="flex-1 flex flex-col gap-2 min-w-0">
        <ContentDetailLayoutHeader content={data} />
        <ContentDetailLayoutTabs content={data} />

        <div className="flex-1 bg-base-100 rounded overflow-auto">
          <Outlet />
        </div>
      </div>
      <ContentDetailLayoutSidebar content={data} />
    </div>
  );
}
