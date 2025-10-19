import { ContentDto } from '@shared/dtos/content.dto';
import { Copy, CopyCheck } from 'lucide-react';
import { useState } from 'react';
import { useParams } from 'react-router';

import { useContentDetailQuery } from '~/hooks/api/useContentApi';
import { splitVersionsAndLoaders } from '~/utils/discover.utils';

export default function DiscoverDetailPanel() {
  const { slug } = useParams<{ slug: string }>();
  const { data } = useContentDetailQuery({ slug: slug! });

  const { versions, loaders } = splitVersionsAndLoaders(data?.gameVersions || []);

  return (
    <div className="w-64 bg-base-200 flex flex-col overflow-auto">
      <div className="divider m-0 mt-3">Summary</div>
      <div className="p-4">
        <p className="text-sm text-base-content/70">{data?.summary}</p>
      </div>

      <div className="divider m-0">Details</div>
      <SectionDetail
        id={data?.id}
        downloadCount={data?.downloadCount}
        dateCreated={data?.dateCreated}
        dateModified={data?.dateModified}
        dateReleased={data?.dateReleased}
      />

      <div className="divider m-0">Game Versions</div>
      <SectionGameVersions gameVersions={versions} />

      <div className="divider m-0">Mod Loaders</div>
      <SectionModLoaders modLoaders={loaders} />

      <div className="divider m-0">Categories</div>
      <SectionCategories categories={data?.categories || []} />
    </div>
  );
}

function SectionDetail({
  id,
  downloadCount,
  dateCreated,
  dateModified,
  dateReleased,
}: {
  id: number | undefined;
  downloadCount: number | undefined;
  dateCreated: Date | undefined;
  dateModified: Date | undefined;
  dateReleased: Date | undefined;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!id) return;
    navigator.clipboard.writeText(String(id));
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="grid grid-cols-2 gap-4 p-4">
      <p className="label">Downloads</p>
      <span>{downloadCount?.toLocaleString() ?? '0'}</span>

      <p className="label">Created</p>
      <span>{dateCreated ? new Date(dateCreated).toLocaleDateString() : 'Unknown'}</span>

      <p className="label">Updated</p>
      <span>{dateModified ? new Date(dateModified).toLocaleDateString() : 'Unknown'}</span>

      <p className="label">Released</p>
      <span>{dateReleased ? new Date(dateReleased).toLocaleDateString() : 'Unknown'}</span>

      <p className="label">Project Id</p>
      <div className="flex items-center gap-2">
        <span>{id}</span>
        {copied ? (
          <CopyCheck size={16} className="text-success cursor-pointer" />
        ) : (
          <Copy size={16} className="cursor-pointer hover:text-success transition-colors" onClick={handleCopy} />
        )}
      </div>
    </div>
  );
}

function SectionGameVersions({ gameVersions }: { gameVersions: string[] }) {
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

function SectionModLoaders({ modLoaders }: { modLoaders: string[] }) {
  const hasLoaderTypes = Boolean(modLoaders && modLoaders.length);

  return (
    <div className="flex flex-wrap gap-2 p-4">
      {hasLoaderTypes
        ? modLoaders?.map((loader) => (
            <button key={loader} className="btn btn-soft btn-xs">
              {loader}
            </button>
          ))
        : Array.from({ length: 4 }).map((_, index) => <div className="skeleton h-6" key={index}></div>)}
    </div>
  );
}

function SectionCategories({ categories }: { categories: ContentDto['categories'] }) {
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
