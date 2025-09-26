import ContentFilter from './components/ContentFilter';
import ContentList from './components/ContentList';
import { ContentProvider } from './context/ContentContext';

export default function ContentPage() {
  return (
    <ContentProvider>
      <div className="flex h-full">
        <ContentFilter className="w-[250px]" />
        <ContentList className="flex-1" />
      </div>
    </ContentProvider>
  );
}
