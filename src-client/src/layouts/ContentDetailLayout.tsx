import { categoryMap } from '@shared/mappings/general.mapping';
import { useState } from 'react';
import { Outlet, useNavigate, useParams } from 'react-router';

import { useFindOneContentQuery } from '~/hooks/api/useContent';
import { useContainer } from '~/hooks/app/useContainer';

export default function ContentDetailLayout() {
  const { id } = useParams<{ id: string }>();
  const { height, isReady } = useContainer();

  const [expanded, setExpanded] = useState(false);

  const navigate = useNavigate();

  const { data } = useFindOneContentQuery(Number(id));

  return (
    <div className="flex gap-4 p-4" style={{ height: isReady ? height : '0px' }}>
      {/* Header */}
      <div className="flex-1 flex flex-col gap-2">
        <div className="flex justify-between p-3 gap-3 bg-base-100 rounded">
          <div className="flex gap-3">
            <div className="w-20">
              <img src={data?.logo.url} alt={data?.logo.title} loading="lazy" className="w-full h-full object-cover" />
            </div>

            <div className="flex flex-col gap-2">
              <p className="font-semibold text-2xl">{data?.name}</p>
              <div className="flex items-center gap-2 mt-2">
                <span>By</span>
                <div className="badge badge-soft">
                  <img src={data?.authors[0].avatarUrl} alt={data?.authors[0].name} className="w-4 h-4 rounded-full" />
                  {data?.authors[0].name}
                </div>
                <div className="divider divider-horizontal"></div>
                <button className="btn btn-outline btn-sm">
                  {data?.classId ? categoryMap.idToText[data.classId] : 'Unknown'}
                </button>
              </div>
            </div>
          </div>

          <button className="btn btn-soft btn-primary w-[20%]">Install</button>
        </div>

        {/* Select Tab */}
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
            aria-label="Gallery (0)"
            onChange={() => navigate('gallery')}
          />
          {Object.entries(data?.links ?? {}).map(([key, value]) => {
            if (!value) return null;
            const label = key.replace(/Url$/, '');
            const display = label.charAt(0).toUpperCase() + label.slice(1);

            return (
              <a
                key={key}
                href={value}
                className="tab items-center flex-nowrap"
                target="_blank"
                rel="noreferrer noopener"
              >
                <span className="me-1">{display}</span>
                <i className="fa-light fa-arrow-up-right-from-square"></i>
              </a>
            );
          })}
        </div>

        {/* Section Tab */}
        <div className="flex-1 bg-base-100 rounded overflow-auto">
          <Outlet />
        </div>
      </div>

      {/* Sidebar */}
      <div className="bg-base-100 w-64 rounded overflow-auto no-scrollbar h-full">
        <div className="p-4">
          <button className="btn btn-soft w-full" onClick={() => navigate(-1)}>
            <i className="fa-light fa-arrow-left"></i>
            <span>Back</span>
          </button>
        </div>

        <div className="divider m-0">Summary</div>

        <div className="p-4">
          <p className={`text-sm text-base-content/60 ${expanded ? '' : 'line-clamp-2'}`}>{data?.summary}</p>

          {data?.summary && data?.summary.length > 0 && (
            <button onClick={() => setExpanded(!expanded)} className="text-primary text-xs mt-1 hover:underline">
              {expanded ? 'Read less' : 'Read more'}
            </button>
          )}
        </div>

        <div className="divider m-0">Details</div>

        <div className="grid grid-cols-2 gap-4 p-4">
          <p className="label">Downloads</p>
          <span>{data?.downloadCount?.toLocaleString() ?? '0'}</span>

          <p className="label">Created</p>
          <span>{data?.dateCreated ? new Date(data.dateCreated).toLocaleDateString() : 'Unknown'}</span>

          <p className="label">Updated</p>
          <span>{data?.dateModified ? new Date(data.dateModified).toLocaleDateString() : 'Unknown'}</span>

          <p className="label">Released</p>
          <span>{data?.dateReleased ? new Date(data.dateReleased).toLocaleDateString() : 'Unknown'}</span>

          <p className="label">Project Id</p>
          <div className="flex items-center gap-2">
            <span>{data?.id}</span>
            <i
              className="fa-light fa-copy cursor-pointer hover:text-primary"
              onClick={() => navigator.clipboard.writeText(String(data?.id))}
            ></i>
          </div>
        </div>

        <div className="divider m-0">Game Versions</div>

        <div className="grid grid-cols-4 gap-2 p-4">
          {data?.gameVersions && data.gameVersions.length > 0
            ? data.gameVersions.slice(0, 6).map((version) => (
                <button key={version} className="btn btn-soft btn-xs">
                  {version}
                </button>
              ))
            : Array.from({ length: 8 }).map((_, index) => <div className="skeleton h-6" key={index}></div>)}

          {data?.gameVersions && data.gameVersions.length > 6 && (
            <button className="btn btn-soft btn-xs col-span-2">+{data.gameVersions.length - 6} Versions</button>
          )}
        </div>

        <div className="divider m-0">Mod Loaders</div>

        <div className="flex flex-wrap gap-2 p-4">
          {data?.loaderTypes && data.loaderTypes.length
            ? data.loaderTypes?.map((loader) => (
                <button key={loader} className="btn btn-soft btn-xs">
                  {loader}
                </button>
              ))
            : Array.from({ length: 4 }).map((_, index) => <div className="skeleton h-6" key={index}></div>)}
        </div>

        <div className="divider m-0">Categories</div>

        <div className="flex flex-wrap gap-2 p-4">
          {data?.categories && data.categories.length
            ? data?.categories?.map((cat) => (
                <button key={cat.id} className="btn btn-soft btn-xs">
                  {cat.name}
                </button>
              ))
            : Array.from({ length: 4 }).map((_, index) => <div className="skeleton h-6" key={index}></div>)}
        </div>
      </div>
    </div>
  );
}
