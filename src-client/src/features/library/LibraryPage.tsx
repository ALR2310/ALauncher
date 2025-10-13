import { useContainer } from '~/hooks/app/useContainer';
import SideRightBar from '~/layouts/SideRightBar';

export default function LibraryPage() {
  const { height, width } = useContainer();

  return (
    <div className="flex" style={{ height, width }}>
      <div className="flex-1 grid grid-cols-3 lg:grid-cols-6 gap-4"></div>

      <SideRightBar />
    </div>
  );
}
