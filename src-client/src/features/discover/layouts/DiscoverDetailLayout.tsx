import { CATEGORY_CLASS_REVERSED } from '@shared/constants/curseforge.const';
import { capitalize } from '@shared/utils/general.utils';
import { Download, ExternalLink } from 'lucide-react';
import { Outlet, useLocation, useNavigate, useParams } from 'react-router';

import Img from '~/components/Img';
import { ROUTES } from '~/constants/routes';
import { useContentDetailQuery } from '~/hooks/api/useContentApi';
import { useContainer } from '~/hooks/app/useContainer';

import DiscoverDetailPanel from './DiscoverDetailPanel';

export default function DiscoverDetailLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { height, width } = useContainer();
  const { slug } = useParams<{ slug: string }>();
  const { data } = useContentDetailQuery({ slug: slug! });

  const currentPath = location.pathname;
  const isGalleryTab = currentPath.endsWith('/gallery');
  const isFilesTab = currentPath.endsWith('/files');
  const isDescriptionTab = !isGalleryTab && !isFilesTab;

  if (data) {
    return (
      <div className="flex" style={{ height, width }}>
        <div className="flex-1 flex flex-col min-h-0 gap-3 p-4">
          {/* Header */}
          <div className="flex gap-3">
            <Img src={data.logo.url} alt={data.logo.title} className="w-[70px] h-[70px] object-cover" />

            <div className="flex-1 flex flex-col gap-2">
              <h2 className="text-lg font-semibold">{data.name}</h2>
              <div className="flex items-center gap-2">
                <span>By</span>
                <div className="badge badge-soft px-2">
                  <Img src={data.authors[0].avatarUrl} alt={data.authors[0].name} className="w-4 h-4 rounded-full" />
                  <span>{data.authors[0].name}</span>
                </div>

                <div className="divider divider-horizontal mx-2"></div>

                {data.classId && (
                  <button className="btn btn-xs btn-outline">{CATEGORY_CLASS_REVERSED[data.classId]}</button>
                )}
              </div>
            </div>

            <div className="p-4 w-44">
              <button className="btn btn-block btn-success text-center">
                <Download size={16} /> Install
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex-1 flex flex-col min-h-0 gap-1">
            <div className="tabs tabs-border tabs-border-success">
              <input
                type="radio"
                name="discover_detail"
                className="tab"
                aria-label="Description"
                checked={isDescriptionTab}
                onChange={() => navigate(ROUTES.DISCOVER_DETAIL(slug!), { relative: 'path' })}
              />
              <input
                type="radio"
                name="discover_detail"
                className="tab"
                aria-label="Files"
                checked={isFilesTab}
                onChange={() => navigate(ROUTES.DISCOVER_DETAIL_FILES(slug!), { relative: 'path' })}
              />
              <input
                type="radio"
                name="discover_detail"
                className="tab"
                aria-label={`Gallery (${data.screenshots.length})`}
                checked={isGalleryTab}
                onChange={() => navigate(ROUTES.DISCOVER_DETAIL_GALLERY(slug!), { relative: 'path' })}
              />
              {Object.entries(data.links ?? {}).map(([key, value]) => {
                if (!value) return null;
                const label = key.replace(/Url$/, '');

                return (
                  <a key={key} href={value} className="tab items-center">
                    <span className="me-1">{capitalize(label)}</span>
                    <ExternalLink size={16} />
                  </a>
                );
              })}
            </div>

            <div className="flex-1 bg-base-100 rounded-xl overflow-auto">
              <Outlet />
            </div>
          </div>
        </div>

        <DiscoverDetailPanel />
      </div>
    );
  }
}
