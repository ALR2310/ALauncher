import HomeNotePage from './HomeNotePage';
import HomeSidePage from './HomeSidePage';

export default function HomePage() {
  return (
    <div className="flex h-full">
      <HomeSidePage className="flex-1/4" />
      <HomeNotePage className="flex-3/4" />
    </div>
  );
}
