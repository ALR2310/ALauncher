import { CurseForgeModsSearchSortField, CurseForgeSortOrder } from 'curseforge-api';

import { useContentsQueries } from '~/hooks/api/useContentApi';
import { useContainer } from '~/hooks/app/useContainer';
import SideRightBar from '~/layouts/SideRightBar';

import { HomeContentCard } from './components/HomeContentCard';

export default function HomePage() {
  const { height, width } = useContainer();

  const result = useContentsQueries([
    {
      classId: 4471, // Modpacks
      sortField: CurseForgeModsSearchSortField.Popularity,
      sortOrder: CurseForgeSortOrder.Descending,
      pageSize: 4,
    },
    {
      classId: 6, // Mods
      sortField: CurseForgeModsSearchSortField.Popularity,
      sortOrder: CurseForgeSortOrder.Descending,
      pageSize: 4,
    },
  ]);

  const isLoading = result.some((r) => r.isLoading);
  const [modpack, mod] = result.map((r) => r.data);

  return (
    <div className="flex" style={{ height, width }}>
      <div className="flex-1 p-4 space-y-6 overflow-y-auto">
        <HomeContentCard title="Discover a modpack" data={modpack?.data || []} isLoading={isLoading} loadingCount={4} />
        <HomeContentCard title="Discover a mod" data={mod?.data || []} isLoading={isLoading} loadingCount={4} />
      </div>

      <SideRightBar />
    </div>
  );
}
