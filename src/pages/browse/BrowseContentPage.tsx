import { abbreviateNumber } from '@shared/utils/general.utils';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { useContextSelector } from 'use-context-selector';

import Select from '~/components/Select';
import { useContentHeight } from '~/hooks/useContentHeight';
import { LauncherContext } from '~/providers/LauncherProvider';

const categoryTypeMap = {
  'mc-mods': 6,
  'data-packs': 6945,
  'texture-packs': 12,
  shaders: 6552,
  worlds: 17,
};

const categoryTitleMap = {
  'mc-mods': 'Mods',
  'data-packs': 'Data Packs',
  'texture-packs': 'Resource Packs',
  shaders: 'Shaders',
  worlds: 'Worlds',
};

const loaderTypeMap = {
  0: '',
  1: 'Forge',
  4: 'Fabric',
  5: 'Quilt',
  6: 'NeoForge',
};

interface BrowseContentPageProps {
  className?: string;
}

export default function BrowseContentPage({ className }: BrowseContentPageProps) {
  const [searchParams, setSearchParams] = useSearchParams();

  const { instanceId } = useParams<{ instanceId: string }>();
  const { height, isReady } = useContentHeight();

  const searchKey = searchParams.get('searchKey') || '';
  const sortField = searchParams.get('sortField') || '2';

  const categoryType = searchParams.get('categoryType') || 'mc-mods';
  const versionSelected = searchParams.get('versionSelected') || '';
  const loaderType = searchParams.get('loaderType') || '0';
  const categoryIds = searchParams.get('categoryIds') ? JSON.parse(searchParams.get('categoryIds')!) : undefined;

  const navigate = useNavigate();

  const getAdditionalQuery = useContextSelector(LauncherContext, (v) =>
    v.getAdditionalQuery({
      classId: categoryTypeMap[categoryType],
      categoryIds,
      gameVersion: versionSelected,
      searchFilter: searchKey,
      sortField,
      modLoaderType: loaderType === '0' ? undefined : loaderType,
      pageSize: 20,
    }),
  );

  const handleSortChange = (val: string) => {
    const next = new URLSearchParams(searchParams);
    next.set('sortField', val);
    setSearchParams(next);
  };

  const handleSearchChange = (val: string) => {
    const next = new URLSearchParams(searchParams);
    next.set('searchKey', val);
    setSearchParams(next);
  };

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
              { label: 'Last Updated', value: '3' },
              { label: 'Name', value: '4' },
              { label: 'Author', value: '5' },
              { label: 'Total Downloads', value: '6' },
              { label: 'Released Date', value: '11' },
              { label: 'Rating', value: '12' },
            ]}
            onChange={handleSortChange}
          />
          <label className="input w-64">
            <i className="fa-light fa-magnifying-glass"></i>
            <input
              type="text"
              placeholder="Search..."
              className="grow"
              value={searchKey}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </label>
        </div>

        <button
          className="btn btn-soft btn-circle"
          onClick={() => {
            navigate(`/manager/${instanceId}`);
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
            <div key={additional.id} className="h-[120px] flex bg-base-100 p-3 rounded gap-4">
              <div className="flex justify-center items-center">
                <img src={additional.logoUrl} alt="mod img" loading="lazy" className="w-full h-full object-cover" />
              </div>

              <div className="flex-1 flex flex-col justify-between">
                <div className="flex">
                  <div className="flex-1 ">
                    <div className="flex items-center font-semibold">
                      <h3 className="text-base-content text-ellipsis-1">{additional.name}</h3>
                      <div className="divider divider-horizontal"></div>
                      <p className="text-base-content/60 text-nowrap">by {additional.authors[0].name}</p>
                    </div>

                    <p className="text-sm text-base-content/80 text-ellipsis-1 overflow-hidden">{additional.summary}</p>
                  </div>

                  <div className="w-[15%]">
                    <button className="btn btn-soft btn-primary w-full">Install</button>
                  </div>
                </div>

                <div className="divider m-0"></div>

                <div className="flex justify-between text-xs text-base-content/70">
                  <div className="flex items-center gap-2">
                    <button className="btn btn-outline btn-xs">{categoryTitleMap[categoryType]}</button>
                    <div className="flex gap-2 overflow-hidden text-ellipsis-1 w-[50%]">
                      {additional.categories.map((cat, idx) => (
                        <a href="#" key={idx} className=" hover:underline">
                          {cat.name}
                        </a>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-nowrap">
                    <p>
                      <i className="fa-light fa-download"></i> {abbreviateNumber(additional.downloadCount)}
                    </p>
                    <p>
                      <i className="fa-light fa-clock-three"></i>{' '}
                      {new Date(additional.dateModified).toLocaleDateString()}
                    </p>
                    <p>
                      <i className="fa-light fa-database"></i> {additional.fileSize}
                    </p>
                    <p>
                      <i className="fa-light fa-gamepad-modern"></i> {versionSelected}
                    </p>
                    <p>{loaderTypeMap[loaderType]}</p>
                  </div>
                </div>
              </div>
            </div>
          )),
        )}
        {getAdditionalQuery.isFetchingNextPage && <p className="text-center">Loading more...</p>}
      </div>
    </div>
  );
}
