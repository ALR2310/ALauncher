import { SORT_FIELD } from '@shared/constants/curseforge.const';
import { useVirtualizer } from '@tanstack/react-virtual';
import { CurseForgeSortOrder } from 'curseforge-api';
import { Search } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useContextSelector } from 'use-context-selector';

import { DiscoverContext } from '~/context/DiscoverContext';
import { useContentsInfinite } from '~/hooks/api/useContentApi';
import { useContainer } from '~/hooks/app/useContainer';

import ContentCard from './components/ContentCard';
import ContentCardSkeleton from './components/ContentCardSkeleton';
import DiscoverFilterBar from './components/DiscoverFilterBar';

const LoadingCount = Array.from({ length: 10 });

export default function DiscoverList() {
  const { height, width } = useContainer();
  const scrollElementRef = useRef<HTMLDivElement | null>(null);

  const sortField = useContextSelector(DiscoverContext, (v) => v.sortField);
  const setSortField = useContextSelector(DiscoverContext, (v) => v.setSortField);
  const searchFilter = useContextSelector(DiscoverContext, (v) => v.searchFilter);
  const setSearchFilter = useContextSelector(DiscoverContext, (v) => v.setSearchFilter);
  const categoryIds = useContextSelector(DiscoverContext, (v) => v.categoryIds);
  const categoryType = useContextSelector(DiscoverContext, (v) => v.categoryType);
  const gameVersion = useContextSelector(DiscoverContext, (v) => v.gameVersion);
  const loaderType = useContextSelector(DiscoverContext, (v) => v.loaderType);
  const instanceId = useContextSelector(DiscoverContext, (v) => v.instanceId);

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useContentsInfinite({
    instance: instanceId,
    classId: categoryType,
    categoryIds: Array.from(categoryIds).join(','),
    searchFilter,
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

  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: allContents.length,
    getScrollElement: () => scrollElementRef.current,
    estimateSize: () => 120,
    gap: 16,
    overscan: 5,
  });

  const virtualItems = virtualizer.getVirtualItems();

  useEffect(() => {
    if (!virtualItems.length) return;
    const lastItem = virtualItems[virtualItems.length - 1];
    if (!lastItem) return;
    if (lastItem.index >= allContents.length - 3 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [virtualItems, allContents.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div className="flex" style={{ height, width }}>
      <div className="flex-1 flex flex-col min-h-0 p-4 pe-1 gap-4">
        <div className="flex gap-4">
          <select className="select w-38" value={sortField} onChange={handleSortChange}>
            {Object.entries(SORT_FIELD).map(([key, value]) => (
              <option key={value} value={value}>
                {key}
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
            <div
              style={{
                height: `${virtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {virtualItems.map((virtualItem) => {
                const content = allContents[virtualItem.index];
                return (
                  <div
                    key={virtualItem.key}
                    data-index={virtualItem.index}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualItem.size}px`,
                      transform: `translateY(${virtualItem.start}px)`,
                    }}
                  >
                    <ContentCard
                      data={content}
                      gameVersion={gameVersion}
                      categoryType={categoryType}
                      instanceId={instanceId}
                    />
                  </div>
                );
              })}

              {isFetchingNextPage && (
                <div
                  style={{
                    position: 'absolute',
                    top: `${virtualizer.getTotalSize()}px`,
                    left: 0,
                    width: '100%',
                    padding: '12px 0',
                    textAlign: 'center',
                    fontSize: '0.875rem',
                    opacity: 0.7,
                  }}
                >
                  Loading more...
                </div>
              )}
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
