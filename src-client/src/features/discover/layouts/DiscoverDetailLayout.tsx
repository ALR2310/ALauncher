import { CATEGORY_CLASS_REVERSED } from '@shared/constants/curseforge.const';
import { capitalize } from '@shared/utils/general.utils';
import { ExternalLink } from 'lucide-react';
import { Outlet, useLocation, useNavigate, useParams } from 'react-router';

import Img from '~/components/Img';
import { ROUTES } from '~/constants/routes';
import { useContentsQuery } from '~/hooks/api/useContentApi';
import { useContainer } from '~/hooks/app/useContainer';

import DiscoverDetailPanel from '../components/DiscoverDetailPanel';

export default function DiscoverDetailLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { height, width } = useContainer();
  const { slug } = useParams<{ slug: string }>();
  const { data } = useContentsQuery({ slug });

  const content = data?.data[0];

  const currentPath = location.pathname;
  const isGalleryTab = currentPath.endsWith('/gallery');
  const isFilesTab = currentPath.endsWith('/files');
  const isDescriptionTab = !isGalleryTab && !isFilesTab;

  if (content) {
    return (
      <div className="flex" style={{ height, width }}>
        <div className="flex-1 flex flex-col min-h-0 gap-3 p-4">
          {/* Header */}
          <div className="flex gap-3">
            <Img src={content.logo.url} alt={content.logo.title} className="w-[70px] h-[70px] object-cover" />

            <div className="flex-1 flex flex-col gap-2">
              <h2 className="text-lg font-semibold">{content.name}</h2>
              <div className="flex items-center gap-2">
                <span>By</span>
                <div className="badge badge-soft px-2">
                  <Img
                    src={content.authors[0].avatarUrl}
                    alt={content.authors[0].name}
                    className="w-4 h-4 rounded-full"
                  />
                  <span>{content.authors[0].name}</span>
                </div>

                <div className="divider divider-horizontal mx-2"></div>

                {content.classId && (
                  <button className="btn btn-xs btn-outline">{CATEGORY_CLASS_REVERSED[content.classId]}</button>
                )}
              </div>
            </div>
          </div>

          {/* Summary */}
          <p className="text-base-content/70">{content.summary}</p>

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
                aria-label={`Gallery (${content.screenshots.length})`}
                checked={isGalleryTab}
                onChange={() => navigate(ROUTES.DISCOVER_DETAIL_GALLERY(slug!), { relative: 'path' })}
              />
              {Object.entries(content.links ?? {}).map(([key, value]) => {
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

            <div className="flex-1 bg-base-100 rounded-xl">
              <Outlet />
            </div>
          </div>
        </div>

        <DiscoverDetailPanel />
      </div>
    );
  }
}
