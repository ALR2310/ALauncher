import BrowseContentPage from './BrowseContentPage';
import BrowseFilterPage from './BrowseFilterPage';

export default function BrowsePage() {
  return (
    <div className="flex h-full">
      <BrowseFilterPage className="w-[240px]" categoryId={6} />
      <BrowseContentPage className="flex-1" />
    </div>
  );
}
