import { useContainer } from '~/hooks/app/useContainer';

export default function DiscoverDetailPage() {
  const { height, width } = useContainer();

  return <div className="flex" style={{ height, width }}></div>;
}
