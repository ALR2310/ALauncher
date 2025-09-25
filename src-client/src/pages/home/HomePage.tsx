import HomeReleaseNote from './components/HomeReleaseNote';
import HomeSidebar from './components/HomeSidebar';

export default function HomePage() {
  return (
    <div className="flex h-full">
      <HomeSidebar className="flex-1/4" />
      <HomeReleaseNote className="flex-3/4" />
    </div>
  );
}
