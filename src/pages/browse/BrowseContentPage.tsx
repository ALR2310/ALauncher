import { useNavigate, useParams, useSearchParams } from 'react-router';
import { useContextSelector } from 'use-context-selector';

import Select from '~/components/Select';
import { useContentHeight } from '~/hooks/useContentHeight';
import { useDebounce } from '~/hooks/useDebounce';
import { LauncherContext } from '~/providers/LauncherProvider';

import AdditionalCard from './components/AdditionalCard';
import AdditionalSkeleton from './components/AdditionalSkeleton';

const categoryTypeMap = {
  'mc-mods': 6,
  'data-packs': 6945,
  'texture-packs': 12,
  shaders: 6552,
  worlds: 17,
};

interface BrowseContentPageProps {
  className?: string;
}

export default function BrowseContentPage({ className }: BrowseContentPageProps) {
  const [searchParams, setSearchParams] = useSearchParams();

  const { instanceId } = useParams<{ instanceId: string }>();
  const { height, isReady } = useContentHeight();

  const sortField = searchParams.get('sortField') || '2';
  const searchFilter = searchParams.get('searchFilter') || '';
  const debouncedSearchFilter = useDebounce(searchFilter, 500);

  const categoryType = searchParams.get('categoryType') || 'mc-mods';
  const gameVersion = searchParams.get('gameVersion') || '';
  const loaderType = searchParams.get('loaderType') || '0';
  const categoryIds = searchParams.get('categoryIds') ? JSON.parse(searchParams.get('categoryIds')!) : undefined;

  const navigate = useNavigate();

  const getAdditionalQuery = useContextSelector(LauncherContext, (v) =>
    v.getAdditionalQuery({
      classId: categoryTypeMap[categoryType],
      categoryIds,
      gameVersion,
      searchFilter: debouncedSearchFilter,
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
    next.set('searchFilter', val);
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
              value={searchFilter}
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
        {getAdditionalQuery.isLoading && Array.from({ length: 20 }).map((_, i) => <AdditionalSkeleton key={i} />)}
        {getAdditionalQuery.data?.pages.map((page) =>
          page.data.map((additional) => (
            <AdditionalCard
              key={additional.id}
              data={additional}
              categoryType={categoryType}
              versionSelected={gameVersion}
              loaderType={loaderType}
            />
          )),
        )}
        {getAdditionalQuery.isFetchingNextPage &&
          Array.from({ length: 10 }).map((_, i) => <AdditionalSkeleton key={i} />)}
      </div>
    </div>
  );
}
