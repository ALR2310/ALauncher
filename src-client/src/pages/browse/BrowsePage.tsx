import ContentFilter from './components/ContentFilter';
import ContentList from './components/ContentList';

export default function BrowsePage() {
  return (
    <div className="flex h-full">
      <ContentFilter className="w-[250px]" />
      <ContentList className="flex-1" />
    </div>
  );
}
