import type { DetailContentResponseDto } from '@shared/dtos/content.dto';
import { useNavigate } from 'react-router';

interface ContentDetailLayoutTabsProps {
  content?: DetailContentResponseDto;
}

export default function ContentDetailLayoutTabs({ content }: ContentDetailLayoutTabsProps) {
  const navigate = useNavigate();
  const galleryCount = content?.screenshots?.length ?? 0;
  const galleryLabel = `Gallery (${galleryCount})`;

  return (
    <div className="tabs tabs-border">
      <input
        type="radio"
        name="content_details_tab"
        className="tab"
        aria-label="Description"
        defaultChecked
        onChange={() => navigate('')}
      />
      <input
        type="radio"
        name="content_details_tab"
        className="tab"
        aria-label="Files"
        onChange={() => navigate('files')}
      />
      <input
        type="radio"
        name="content_details_tab"
        className="tab"
        aria-label={galleryLabel}
        onChange={() => navigate('gallery')}
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

