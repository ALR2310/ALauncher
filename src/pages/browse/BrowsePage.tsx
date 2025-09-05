import BrowseContentPage from './BrowseContentPage';
import BrowseFilterPage from './BrowseFilterPage';

export default function BrowsePage() {
  return (
    <div className="flex h-full">
      <BrowseFilterPage className="flex-1/4" categoryId={6} />
      <BrowseContentPage className="flex-3/4" />
    </div>
  );
}
