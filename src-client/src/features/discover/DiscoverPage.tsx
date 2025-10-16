import { Search } from 'lucide-react';

import { useContentsInfinite } from '~/hooks/api/useContentApi';
import { useContainer } from '~/hooks/app/useContainer';

import ContentCard from './components/ContentCard';

export default function DiscoverPage() {
  const { height, width } = useContainer();
  const { data: contents } = useContentsInfinite({
    pageSize: 20,
  });

  const allContents = contents?.pages.flatMap((page) => page.data) ?? [];

  return (
    <div className="flex" style={{ height, width }}>
      <div className="flex-1 flex flex-col min-h-0 p-4 pe-1 gap-4 overflow-auto">
        <div className="flex gap-4">
          <select className="select w-38">
            <option value="1">Featured</option>
            <option value="2">Popularity</option>
            <option value="3">Last Updated</option>
            <option value="4">Name</option>
            <option value="5">Author</option>
            <option value="6">Total Downloads</option>
            <option value="11">Released Date</option>
            <option value="12">Rating</option>
          </select>

          <label className="input flex-1">
            <Search size={20} className="rotate-90 text-base-content/60" />
            <input type="search" required placeholder="Search..." />
          </label>

          <select className="select w-32">
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>

        <div className="flex-1 space-y-4">
          {allContents.map((content) => (
            <ContentCard key={content.id} data={content} />
          ))}
        </div>
      </div>

      {/* Filter */}
      <div className="w-64"></div>
    </div>
  );
}
