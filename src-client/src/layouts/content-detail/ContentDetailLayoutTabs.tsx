import type { DetailContentResponseDto } from '@shared/dtos/content.dto';
import { useLocation, useNavigate, useSearchParams } from 'react-router';

export default function ContentDetailLayoutTabs({ content }: { content?: DetailContentResponseDto }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const searchString = searchParams.toString();
  const query = searchString ? `?${searchString}` : '';

  const galleryCount = content?.screenshots?.length ?? 0;
  const galleryLabel = `Gallery (${galleryCount})`;

  // Determine which tab is currently active based on the URL
  const currentPath = location.pathname;
  const isFilesTab = currentPath.endsWith('/files');
  const isGalleryTab = currentPath.endsWith('/gallery');
  const isDescriptionTab = !isFilesTab && !isGalleryTab;

  return (
    <div className="tabs tabs-border">
      <input
        type="radio"
        name="content_details_tab"
        className="tab"
        aria-label="Description"
        checked={isDescriptionTab}
        onChange={() => navigate(`.${query}`, { relative: 'path' })}
      />
      <input
        type="radio"
        name="content_details_tab"
        className="tab"
        aria-label="Files"
        checked={isFilesTab}
        onChange={() => navigate(`files${query}`)}
      />
      <input
        type="radio"
        name="content_details_tab"
        className="tab"
        aria-label={galleryLabel}
        checked={isGalleryTab}
        onChange={() => navigate(`gallery${query}`)}
      />
      {Object.entries(content?.links ?? {}).map(([key, value]) => {
        if (!value) return null;
        const label = key.replace(/Url$/, '');
        const display = label.charAt(0).toUpperCase() + label.slice(1);

        return (
          <a key={key} href={value} className="tab items-center flex-nowrap" target="_blank" rel="noreferrer noopener">
            <span className="me-1">{display}</span>
            <i className="fa-light fa-arrow-up-right-from-square"></i>
          </a>
        );
      })}
    </div>
  );
}
