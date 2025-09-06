import BrowseContentPage from './BrowseContentPage';
import BrowseFilterPage from './BrowseFilterPage';

export default function BrowsePage() {
  return (
    <div className="flex h-full">
      <BrowseFilterPage className="w-[250px]" />
      <BrowseContentPage className="flex-1" />
    </div>
  );
}
