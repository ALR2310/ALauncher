import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router';

export default function HomePage() {
  return (
    <div className="p-4">
      <div className="flex">
        <div className="flex items-center group">
          <Link
            to=""
            className="leading-2 font-semibold relative after:content-[''] after:absolute after:left-0 after:top-[12px] after:w-0 after:h-[2px] after:bg-success after:transition-all after:duration-300 group-hover:after:w-full"
          >
            Discover a modpack
          </Link>
          <ChevronRight
            size={16}
            strokeWidth={3}
            className="transition-all duration-300 group-hover:text-success group-hover:translate-x-1"
          />
        </div>
      </div>

      <div className="grid grid-cols-3">
        <Link to={''} className="rounded-lg"></Link>
      </div>
    </div>
  );
}
