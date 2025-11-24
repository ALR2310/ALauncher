import { splitCamelCase } from '@shared/utils/general.utils';
import { CurseForgeModsSearchSortField, CurseForgeSortOrder } from 'curseforge-api';
import { Search } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useContextSelector } from 'use-context-selector';

import { DiscoverContext } from '~/context/DiscoverContext';
import { useContentsInfinite } from '~/hooks/api/useContentApi';
import { useContainer } from '~/hooks/app/useContainer';
import { useDebounce } from '~/hooks/app/useDebounce';

import ContentCard from './components/ContentCard';
import ContentCardSkeleton from './components/ContentCardSkeleton';
import DiscoverFilterBar from './components/DiscoverFilterBar';

const LoadingCount = Array.from({ length: 10 });

const SortField = [
  CurseForgeModsSearchSortField.Popularity,
  CurseForgeModsSearchSortField.LastUpdated,
  CurseForgeModsSearchSortField.TotalDownloads,
  CurseForgeModsSearchSortField.ReleasedDate,
];

export default function DiscoverList() {
  const { height, width } = useContainer();
  const scrollElementRef = useRef<HTMLDivElement | null>(null);
  const loaderRef = useRef<HTMLDivElement | null>(null);

  const sortField = useContextSelector(DiscoverContext, (v) => v.sortField);
  const setSortField = useContextSelector(DiscoverContext, (v) => v.setSortField);
  const searchFilter = useContextSelector(DiscoverContext, (v) => v.searchFilter);
  const setSearchFilter = useContextSelector(DiscoverContext, (v) => v.setSearchFilter);
  const categoryIds = useContextSelector(DiscoverContext, (v) => v.categoryIds);
  const categoryType = useContextSelector(DiscoverContext, (v) => v.categoryType);
  const gameVersion = useContextSelector(DiscoverContext, (v) => v.gameVersion);
  const loaderType = useContextSelector(DiscoverContext, (v) => v.loaderType);
  const instanceId = useContextSelector(DiscoverContext, (v) => v.instanceId);

  const searchFilterDebounced = useDebounce(searchFilter);

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useContentsInfinite({
    instance: instanceId,
    classId: categoryType,
    categoryIds: Array.from(categoryIds).join(','),
    searchFilter: searchFilterDebounced,
    gameVersion,
    modLoaderType: loaderType === 0 ? undefined : loaderType,
    sortField,
    sortOrder: CurseForgeSortOrder.Descending,
    pageSize: 20,
  });

  const allContents = useMemo(() => data?.pages.flatMap((page) => page.data) ?? [], [data?.pages]);

  const handleSortChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setSortField(Number(e.target.value));
    },
    [setSortField],
  );

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchFilter(e.target.value);
    },
    [setSearchFilter],
  );

  useEffect(() => {
    if (!loaderRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage();
      },
      { root: scrollElementRef.current, rootMargin: '0px 0px 200px 0px', threshold: 0.1 },
    );

    const current = loaderRef.current;
    observer.observe(current);
    return () => observer.unobserve(current);
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  return (
    <div className="flex" style={{ height, width }}>
      <div className="flex-1 flex flex-col min-h-0 p-4 pe-1 gap-4">
        <div className="flex gap-4">
          <select className="select w-38" value={sortField} onChange={handleSortChange}>
            {SortField.map((value) => (
              <option key={value} value={value}>
                {splitCamelCase(CurseForgeModsSearchSortField[value])}
              </option>
            ))}
          </select>

          <label className="input w-[50%]">
            <Search size={20} className="text-base-content/60" />
            <input type="search" placeholder="Search..." value={searchFilter} onChange={handleSearchChange} />
          </label>
        </div>

        <div className="flex-1 overflow-auto" id="content-scroll" ref={scrollElementRef}>
          {isLoading ? (
            <div className="space-y-4">
              {LoadingCount.map((_, idx) => (
                <ContentCardSkeleton key={idx} />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {allContents.map((content, idx) => (
                <ContentCard
                  key={idx}
                  data={content}
                  gameVersion={gameVersion}
                  categoryType={categoryType}
                  instanceId={instanceId}
                />
              ))}

              <div ref={loaderRef} className="py-3 text-center text-sm opacity-70">
                {isFetchingNextPage ? 'Loading more...' : hasNextPage ? 'Load more' : ''}
              </div>
            </div>
          )}

          {!isLoading && !hasNextPage && allContents.length > 0 && (
            <div className="py-3 text-center text-sm opacity-70">End of results</div>
          )}

          {!isLoading && allContents.length === 0 && (
            <div className="py-3 text-center text-sm opacity-70">No content found.</div>
          )}
        </div>
      </div>

      <DiscoverFilterBar />
    </div>
  );
}
