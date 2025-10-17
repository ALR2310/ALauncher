import { SORT_FIELD } from '@shared/constants/curseforge.const';
import { Search } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef } from 'react';

import { useContentsInfinite } from '~/hooks/api/useContentApi';
import { useContainer } from '~/hooks/app/useContainer';

import ContentCard from './components/ContentCard';
import ContentCardSkeleton from './components/ContentCardSkeleton';
import DiscoverFilterBar from './components/DiscoverFilterBar';

const LoadingCount = Array.from({ length: 10 });

export default function DiscoverPage() {
  const { height, width } = useContainer();
  const loaderRef = useRef<HTMLDivElement | null>(null);
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useContentsInfinite({
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
          <select className="select w-38">
            {Object.entries(SORT_FIELD).map(([key, value]) => (
              <option key={value} value={value}>
                {key}
              </option>
            ))}
          </select>

          <label className="input">
            <Search size={20} className="rotate-90 text-base-content/60" />
            <input type="search" required placeholder="Search..." />
          </label>
        </div>

        <div className="flex-1 space-y-4 overflow-auto" id="content-scroll">
          {isLoading
            ? LoadingCount.map((_, idx) => <ContentCardSkeleton key={idx} />)
            : allContents.map((content) => <ContentCard key={content.id} data={content} />)}

          <div ref={loaderRef} className="py-3 text-center text-sm opacity-70">
            {isFetchingNextPage ? 'Loading...' : hasNextPage ? 'Load more' : '...'}
          </div>
        </div>
      </div>

      {/* Filter */}
      <DiscoverFilterBar />
    </div>
  );
}
