import { categoryMap } from '@shared/mappings/general.mapping';
import { useNavigate } from 'react-router';
import { useContextSelector } from 'use-context-selector';

import Select from '~/components/Select';
import { useFindAllContentInfinite } from '~/hooks/api/useContent';
import { useFindAllWorldQuery } from '~/hooks/api/useWorld';
import { useContainer } from '~/hooks/app/useContainer';
import { useDebounce } from '~/hooks/app/useDebounce';

import { ContentContext } from '../context/ContentContext';
import { ContentCard, ContentCardSkeleton } from './ContentCard';

interface ContentListProps {
  className?: string;
}

export default function ContentList({ className }: ContentListProps) {
  const { height, isReady } = useContainer();
  const navigate = useNavigate();

  // Get filter states from context
  const instance = useContextSelector(ContentContext, (c) => c.instance);
  const categoryType = useContextSelector(ContentContext, (c) => c.categoryType);
  const gameVersion = useContextSelector(ContentContext, (c) => c.gameVersion);
  const loaderType = useContextSelector(ContentContext, (c) => c.loaderType);
  const categoryIds = useContextSelector(ContentContext, (c) => c.categoryIds);
  const searchFilter = useContextSelector(ContentContext, (c) => c.searchFilter);
  const sortField = useContextSelector(ContentContext, (c) => c.sortField);
  const setSortField = useContextSelector(ContentContext, (c) => c.setSortField);
  const setSearchFilter = useContextSelector(ContentContext, (c) => c.setSearchFilter);

  const debouncedSearchFilter = useDebounce(searchFilter, 500);

  // API queries using context states
  const findAllWorldQuery = useFindAllWorldQuery(instance || undefined);
  const findAllContentQuery = useFindAllContentInfinite({
    instance: instance || undefined,
    classId: categoryMap.keyToId[categoryType],
    categoryIds: categoryIds.size > 0 ? Array.from(categoryIds) : undefined,
    gameVersion,
    searchFilter: debouncedSearchFilter,
    sortField: Number(sortField),
    modLoaderType: loaderType === '0' ? undefined : Number(loaderType),
    pageSize: 50,
    sortOrder: 'desc',
  } as any);

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
            onChange={(value) => setSortField(value)}
          />
          <label className="input w-64">
            <i className="fa-light fa-magnifying-glass"></i>
            <input
              type="text"
              placeholder="Search..."
              className="grow"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
            />
          </label>
        </div>

        <button
          className="btn btn-soft btn-circle"
          onClick={() => {
            if (instance) navigate(`/instances/${instance}`);
          }}
        >
          <i className="fa-light fa-xmark"></i>
        </button>
      </div>

      <div
        className="flex-1 overflow-auto space-y-4"
        onScroll={(e) => {
          const target = e.currentTarget;
          const bottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 300;
          if (bottom && findAllContentQuery.hasNextPage && !findAllContentQuery.isFetchingNextPage) {
            findAllContentQuery.fetchNextPage();
          }
        }}
      >
        {findAllContentQuery.isLoading && Array.from({ length: 20 }).map((_, i) => <ContentCardSkeleton key={i} />)}
        {findAllContentQuery.data?.pages.map((page) =>
          page.data.map((content) => (
            <ContentCard
              key={content.id}
              data={content}
              categoryType={categoryType}
              versionSelected={gameVersion}
              loaderType={loaderType}
              worlds={findAllWorldQuery.data || []}
            />
          )),
        )}
        {findAllContentQuery.isFetchingNextPage &&
          Array.from({ length: 10 }).map((_, i) => <ContentCardSkeleton key={i} />)}
      </div>
    </div>
  );
}
