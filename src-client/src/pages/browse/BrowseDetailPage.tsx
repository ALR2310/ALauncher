import { categoryMap } from '@shared/mappings/general.mapping';
import { abbreviateNumber } from '@shared/utils/general.utils';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useContextSelector } from 'use-context-selector';

import { useContentHeight } from '~/hooks/useContentHeight';
import { LauncherContext } from '~/providers/LauncherProvider';

export default function BrowseDetailPage() {
  const { contentId } = useParams();
  const { height, isReady } = useContentHeight();

  const navigate = useNavigate();

  const contentQuery = useContextSelector(LauncherContext, (v) => v.findOneContentQuery(Number(contentId)));

  const [activeTab, setActiveTab] = useState<'description' | 'files' | 'gallery'>('description');

  const isDownloading = false;
  const progress = 0;

  return (
    <div className="flex flex-col p-4" style={{ height: isReady ? height : '0px' }}>
      <div className="h-[120px] flex bg-base-100 p-3 rounded gap-4">
        <div className="flex justify-center items-center ">
          <img
            src={contentQuery.data?.logo.url}
            alt={contentQuery.data?.logo.title}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex-1 flex flex-col justify-between">
          <div className="flex">
            <div className="flex-1">
              <div className="flex items-center font-semibold ">
                <p className="text-base-content text-ellipsis-1">{contentQuery.data?.name}</p>
                <div className="divider divider-horizontal"></div>
                <p rel="noopener noreferrer" className="text-base-content/60 text-nowrap">
                  by {contentQuery.data?.authors[0].name}
                </p>
              </div>

              <p className="text-sm text-base-content/80 text-ellipsis-1 overflow-hidden">
                {contentQuery.data?.summary}
              </p>
            </div>

            <div className="flex w-[15%] justify-end">
              <button className="btn btn-soft btn-circle" onClick={() => navigate(-1)}>
                <i className="fa-light fa-xmark"></i>
              </button>
            </div>
          </div>

          <div className="divider m-0"></div>

          {isDownloading ? (
            <progress className="progress w-full mb-2 h-3 progress-no-rounded" value={progress} max="100"></progress>
          ) : (
            <div className="flex justify-between text-xs text-base-content/70">
              <div className="flex flex-1/3 items-center gap-2">
                <button className="btn btn-outline btn-xs">
                  {contentQuery.data?.classId ? categoryMap.idToText[contentQuery.data.classId] : ''}
                </button>
                <div className="flex gap-2 overflow-hidden text-ellipsis-1 flex-nowrap w-[80%]">
                  {contentQuery.data?.categories.map((cat, idx) => (
                    <a href="#" key={idx} className="me-2 hover:underline">
                      {cat.name}
                    </a>
                  ))}
                </div>
              </div>

              <div className="flex flex-1/3 items-center gap-4 justify-end">
                <p>
                  <i className="fa-light fa-download"></i> {abbreviateNumber(contentQuery.data?.downloadCount || 0)}
                </p>
                <p>
                  <i className="fa-light fa-clock-three"></i>{' '}
                  {contentQuery.data ? new Date(contentQuery.data.dateModified).toLocaleDateString() : ''}
                </p>
                <p>
                  <i className="fa-light fa-database"></i>
                  {/* {contentQuery.data?.fileSize} */} 0 MB
                </p>
              </div>

              <div className="ms-4 w-[10%]">
                <button className={`btn btn-soft btn-primary w-full`} disabled={isDownloading} onClick={() => {}}>
                  Install
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="tabs tabs-border">
        <input
          type="radio"
          name="content_details_tab"
          className="tab"
          aria-label="Description"
          checked={activeTab === 'description'}
          onChange={() => setActiveTab('description')}
        />
        <input
          type="radio"
          name="content_details_tab"
          className="tab"
          aria-label="Files"
          checked={activeTab === 'files'}
          onChange={() => setActiveTab('files')}
        />
        <input
          type="radio"
          name="content_details_tab"
          className="tab"
          aria-label="Gallery (0)"
          checked={activeTab === 'gallery'}
          onChange={() => setActiveTab('gallery')}
        />
        {Object.entries(contentQuery.data?.links ?? {}).map(([key, value]) => {
          if (!value) return null;
          const label = key.replace(/Url$/, '');
          const display = label.charAt(0).toUpperCase() + label.slice(1);

          return (
            <a key={key} href={value} className="tab items-center" target="_blank" rel="noreferrer noopener">
              <span className="me-1">{display}</span>
              <i className="fa-light fa-arrow-up-right-from-square"></i>
            </a>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'description' && (
        <div
          className="flex-1 p-2 bg-base-100 rounded overflow-y-auto project-description"
          dangerouslySetInnerHTML={{ __html: contentQuery.data?.description || '' }}
        ></div>
      )}

      {activeTab === 'files' && (
        <div className="flex-1 p-2 bg-base-100 rounded-box overflow-y-auto">
          <div className="text-center py-8">
            <i className="fa-light fa-folder-open text-4xl text-base-content/50 mb-4"></i>
            <h3 className="text-lg font-semibold mb-2">Files</h3>
            <p className="text-base-content/70">File listing will be implemented here</p>
          </div>
        </div>
      )}

      {activeTab === 'gallery' && (
        <div className="flex-1 p-2 bg-base-100 rounded-box overflow-y-auto">
          <div className="text-center py-8">
            <i className="fa-light fa-images text-4xl text-base-content/50 mb-4"></i>
            <h3 className="text-lg font-semibold mb-2">Gallery</h3>
            <p className="text-base-content/70">Image gallery will be implemented here</p>
          </div>
        </div>
      )}
    </div>
  );
}
