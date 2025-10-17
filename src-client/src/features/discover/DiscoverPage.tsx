import { SORT_FIELD } from '@shared/constants/curseforge.const';
import { CurseForgeSortOrder } from 'curseforge-api';
import { Search } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useContextSelector } from 'use-context-selector';

import { useContentsInfinite } from '~/hooks/api/useContentApi';
import { useContainer } from '~/hooks/app/useContainer';

import ContentCard from './components/ContentCard';
import ContentCardSkeleton from './components/ContentCardSkeleton';
import DiscoverFilterBar from './components/DiscoverFilterBar';
import { DiscoverContext } from './context/DiscoverContext';

const LoadingCount = Array.from({ length: 10 });

export default function DiscoverPage() {
  const { height, width } = useContainer();
  const loaderRef = useRef<HTMLDivElement | null>(null);

  const sortField = useContextSelector(DiscoverContext, (v) => v.sortField);
  const setSortField = useContextSelector(DiscoverContext, (v) => v.setSortField);
  const searchFilter = useContextSelector(DiscoverContext, (v) => v.searchFilter);
  const setSearchFilter = useContextSelector(DiscoverContext, (v) => v.setSearchFilter);
  const categoryIds = useContextSelector(DiscoverContext, (v) => v.categoryIds);
  const categoryType = useContextSelector(DiscoverContext, (v) => v.categoryType);
  const gameVersion = useContextSelector(DiscoverContext, (v) => v.gameVersion);
  const loaderType = useContextSelector(DiscoverContext, (v) => v.loaderType);
  const instance = useContextSelector(DiscoverContext, (v) => v.instance);

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useContentsInfinite({
    instance,
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

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    if (!loaderRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting) {
          handleLoadMore();
        }
      },
      { root: document.querySelector('#content-scroll'), rootMargin: '0px 0px 400px 0px', threshold: 0.1 },
    );

    const current = loaderRef.current;
    observer.observe(current);
    return () => observer.unobserve(current);
  }, [handleLoadMore]);

  return (
    <div className="flex" style={{ height, width }}>
      <div className="flex-1 flex flex-col min-h-0 p-4 pe-1 gap-4">
        <div className="flex gap-4">
          <select className="select w-38" value={sortField} onChange={(e) => setSortField(Number(e.target.value))}>
            {Object.entries(SORT_FIELD).map(([key, value]) => (
              <option key={value} value={value}>
                {key}
              </option>
            ))}
          </select>

          <label className="input">
            <Search size={20} className="text-base-content/60" />
            <input
              type="search"
              placeholder="Search..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
            />
          </label>
        </div>

        <div className="flex-1 space-y-4 overflow-auto" id="content-scroll">
          {isLoading
            ? LoadingCount.map((_, idx) => <ContentCardSkeleton key={idx} />)
            : allContents.map((content) => <ContentCard key={content.id} data={content} />)}

          <div ref={loaderRef} className="py-3 text-center text-sm opacity-70">
            {isFetchingNextPage ? 'Loading...' : hasNextPage ? 'Load more' : 'No content found.'}
          </div>
        </div>
      </div>

      {/* Filter */}
      <DiscoverFilterBar />
    </div>
  );
}
