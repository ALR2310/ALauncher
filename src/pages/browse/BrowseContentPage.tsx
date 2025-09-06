import { loaderTypeToName } from '@shared/constants/launcher.constant';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useContextSelector } from 'use-context-selector';

import Select from '~/components/Select';
import { useContentHeight } from '~/hooks/useContentHeight';
import { LauncherContext } from '~/providers/LauncherProvider';

import { FilterState } from './BrowseFilterPage';

const categoryTypeMap = {
  'mc-mods': 6,
  'data-packs': 6945,
  'texture-packs': 12,
  shaders: 6552,
  worlds: 17,
};

interface BrowseContentPageProps {
  className?: string;
  filter?: FilterState;
}

export default function BrowseContentPage({ className, filter }: BrowseContentPageProps) {
  const { instanceId } = useParams<{ instanceId: string }>();
  const { height, isReady } = useContentHeight();
  const [searchKey, setSearchKey] = useState('');
  const [sortField, setSortField] = useState('2');

  const navigate = useNavigate();

  const getAdditionalQuery = useContextSelector(LauncherContext, (v) =>
    v.getAdditionalQuery({
      classId: categoryTypeMap[filter?.categoryType || 'mc-mods'],
      categoryIds: filter ? Array.from(filter.selectedCategories).join(',') : undefined,
      gameVersion: filter?.versionSelected,
      searchFilter: searchKey,
      sortField: sortField,
      modLoaderType: filter?.loaderType === '0' ? undefined : filter?.loaderType,
      pageSize: 20,
    }),
  );

  useEffect(() => {
    console.log(getAdditionalQuery.data);
  }, [getAdditionalQuery.data]);

  return (
    <div className={`${className} flex flex-col p-3 space-y-3`} style={{ height: isReady ? height : '0px' }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Select
            className="w-36"
            value={sortField}
            options={[
              { label: 'Featured', value: '1' },
              { label: 'Popularity', value: '2' },
              { label: 'LastUpdated', value: '3' },
              { label: 'Name', value: '4' },
              { label: 'Author', value: '5' },
              { label: 'TotalDownloads', value: '6' },
              { label: 'ReleasedDate', value: '11' },
              { label: 'Rating', value: '12' },
            ]}
            onChange={(val) => setSortField(val)}
          />
          <label className="input w-64">
            <i className="fa-light fa-magnifying-glass"></i>
            <input
              type="text"
              placeholder="Search..."
              className="grow"
              value={searchKey}
              onChange={(e) => setSearchKey(e.target.value)}
            />
          </label>
        </div>

        <button
          className="btn btn-soft btn-circle"
          onClick={() => {
            if (window.history.length > 1) navigate(-1);
            else navigate(`/manager/${instanceId}`);
          }}
        >
          <i className="fa-light fa-xmark"></i>
        </button>
      </div>

      <div
        className="flex-1 overflow-auto space-y-4"
        onScroll={(e) => {
          const target = e.currentTarget;
          const bottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 200;
          if (bottom && getAdditionalQuery.hasNextPage && !getAdditionalQuery.isFetchingNextPage) {
            getAdditionalQuery.fetchNextPage();
          }
        }}
      >
        {getAdditionalQuery.isLoading && <p>Loading...</p>}
        {getAdditionalQuery.data?.pages.map((page) =>
          page.data.map((additional) => (
            <div key={additional.id} className="h-[25%] flex bg-base-100 p-3 rounded gap-4">
              <div className="flex justify-center items-center">
                <img src={additional.logoUrl} alt="mod img" loading="lazy" className="w-full h-full object-cover" />
              </div>

              <div className="flex-1 flex flex-col justify-between">
                {/* ModName and Author */}
                <div className="flex items-center font-semibold">
                  <h3 className="text-base-content text-ellipsis-1">{additional.name}</h3>
                  <div className="divider divider-horizontal"></div>
                  <p className="text-base-content/60 text-nowrap">by {additional.authors[0].name}</p>
                </div>

                {/* Description */}
                <p className="text-sm text-base-content/80 text-ellipsis-1 overflow-hidden">{additional.summary}</p>

                {/* Stats */}
                <div className="flex items-center gap-4 text-sm text-base-content/70">
                  <button className="btn btn-outline btn-xs">{filter?.categoryType}</button>
                  <p>
                    <i className="fa-light fa-download"></i> {additional.downloadCount}
                  </p>
                  <p>
                    <i className="fa-light fa-clock-three"></i> {new Date(additional.dateModified).toLocaleDateString()}
                  </p>
                  <p>
                    <i className="fa-light fa-database"></i> 150MB
                  </p>
                  <p>
                    <i className="fa-light fa-gamepad-modern"></i> {filter?.versionSelected}
                  </p>
                  <p>{filter?.loaderType === '0' ? 'any' : loaderTypeToName[filter!.loaderType]}</p>
                </div>
              </div>

              <div className="w-[15%]">
                <button className="btn btn-soft btn-primary w-full">Install</button>
              </div>
            </div>
          )),
        )}
        {getAdditionalQuery.isFetchingNextPage && <p className="text-center">Loading more...</p>}
      </div>
    </div>
  );
}
