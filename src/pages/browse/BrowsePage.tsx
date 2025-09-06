import { useState } from 'react';

import BrowseContentPage from './BrowseContentPage';
import BrowseFilterPage, { FilterState } from './BrowseFilterPage';

export default function BrowsePage() {
  const [filter, setFilter] = useState<FilterState | undefined>();

  return (
    <div className="flex h-full">
      <BrowseFilterPage className="flex-1/4" categoryId={6} onChange={setFilter} />
      <BrowseContentPage className="flex-3/4" filter={filter} />
    </div>
  );
}
