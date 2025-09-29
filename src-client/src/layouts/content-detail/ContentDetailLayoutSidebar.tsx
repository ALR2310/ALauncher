import type { DetailContentResponseDto } from '@shared/dtos/content.dto';
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';

export default function ContentDetailLayoutSidebar({ content }: { content?: DetailContentResponseDto }) {
  return (
    <div className="bg-base-100 w-64 h-full rounded flex flex-col">
      <ContentDetailLayoutSidebarBackButton />

      <div className="flex-1 overflow-auto no-scrollbar">
        <div className="divider m-0">Summary</div>
        <ContentDetailLayoutSidebarSummary summary={content?.summary} />

        <div className="divider m-0">Details</div>
        <ContentDetailLayoutSidebarDetails content={content} />

        <div className="divider m-0">Game Versions</div>
        <ContentDetailLayoutSidebarGameVersions gameVersions={content?.gameVersions} />

        <div className="divider m-0">Mod Loaders</div>
        <ContentDetailLayoutSidebarLoaderTypes loaderTypes={content?.loaderTypes} />

        <div className="divider m-0">Categories</div>
        <ContentDetailLayoutSidebarCategories categories={content?.categories} />
      </div>
    </div>
  );
}

export function ContentDetailLayoutSidebarBackButton() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const handleBack = () => {
    const from = searchParams.get('from');
    const instance = searchParams.get('instance');

    if (from === 'instance' && instance) {
      navigate(`/instances/${instance}`);
    } else if (from === 'list') {
      navigate(instance ? `/contents?instance=${instance}` : '/contents');
    } else {
      navigate('/');
    }
  };

  return (
    <div className="p-4">
      <button className="btn btn-soft w-full" onClick={handleBack}>
        <i className="fa-light fa-arrow-left"></i>
        <span>Back</span>
      </button>
    </div>
  );
}

export function ContentDetailLayoutSidebarSummary({ summary }: { summary?: string }) {
  const [expanded, setExpanded] = useState(false);
  const hasSummary = Boolean(summary && summary.length > 0);

  return (
    <div className="p-4">
      <p className={`text-sm text-base-content/60 ${expanded ? '' : 'line-clamp-2'}`}>{summary}</p>

      {hasSummary && (
        <button onClick={() => setExpanded((prev) => !prev)} className="text-primary text-xs mt-1 hover:underline">
          {expanded ? 'Read less' : 'Read more'}
        </button>
      )}
    </div>
  );
}

export function ContentDetailLayoutSidebarDetails({ content }: { content?: DetailContentResponseDto }) {
  return (
    <div className="grid grid-cols-2 gap-4 p-4">
      <p className="label">Downloads</p>
      <span>{content?.downloadCount?.toLocaleString() ?? '0'}</span>

      <p className="label">Created</p>
      <span>{content?.dateCreated ? new Date(content.dateCreated).toLocaleDateString() : 'Unknown'}</span>

      <p className="label">Updated</p>
      <span>{content?.dateModified ? new Date(content.dateModified).toLocaleDateString() : 'Unknown'}</span>

      <p className="label">Released</p>
      <span>{content?.dateReleased ? new Date(content.dateReleased).toLocaleDateString() : 'Unknown'}</span>

      <p className="label">Project Id</p>
      <div className="flex items-center gap-2">
        <span>{content?.id}</span>
        <i
          className="fa-light fa-copy cursor-pointer hover:text-primary"
          onClick={() => navigator.clipboard.writeText(String(content?.id ?? ''))}
        ></i>
      </div>
    </div>
  );
}

export function ContentDetailLayoutSidebarGameVersions({ gameVersions }: { gameVersions?: string[] }) {
  const hasVersions = Boolean(gameVersions && gameVersions.length > 0);

  return (
    <div className="grid grid-cols-4 gap-2 p-4">
      {hasVersions
        ? gameVersions?.slice(0, 6).map((version) => (
            <button key={version} className="btn btn-soft btn-xs">
              {version}
            </button>
          ))
        : Array.from({ length: 8 }).map((_, index) => <div className="skeleton h-6" key={index}></div>)}

      {gameVersions && gameVersions.length > 6 && (
        <button className="btn btn-soft btn-xs col-span-2">+{gameVersions.length - 6} Versions</button>
      )}
    </div>
  );
}

export function ContentDetailLayoutSidebarLoaderTypes({ loaderTypes }: { loaderTypes?: string[] }) {
  const hasLoaderTypes = Boolean(loaderTypes && loaderTypes.length);

  return (
    <div className="flex flex-wrap gap-2 p-4">
      {hasLoaderTypes
        ? loaderTypes?.map((loader) => (
            <button key={loader} className="btn btn-soft btn-xs">
              {loader}
            </button>
          ))
        : Array.from({ length: 4 }).map((_, index) => <div className="skeleton h-6" key={index}></div>)}
    </div>
  );
}

export function ContentDetailLayoutSidebarCategories({
  categories,
}: {
  categories?: DetailContentResponseDto['categories'];
}) {
  const hasCategories = Boolean(categories && categories.length);

  return (
    <div className="flex flex-wrap gap-2 p-4">
      {hasCategories
        ? categories?.map((cat) => (
            <button key={cat.id} className="btn btn-soft btn-xs">
              {cat.name}
            </button>
          ))
        : Array.from({ length: 4 }).map((_, index) => <div className="skeleton h-6" key={index}></div>)}
    </div>
  );
}
