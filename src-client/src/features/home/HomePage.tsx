import { abbreviateNumber } from '@shared/utils/general.utils';
import { CurseForgeModsSearchSortField, CurseForgeSortOrder } from 'curseforge-api';
import { ChevronRight, Download, FileArchive } from 'lucide-react';
import { useEffect } from 'react';
import { Link } from 'react-router';

import { useContentsQuery } from '~/hooks/api/useContentApi';
import { useContainer } from '~/hooks/app/useContainer';
import SideRightBar from '~/layouts/SideRightBar';

export default function HomePage() {
  const { height, width } = useContainer();

  const { data: modpack } = useContentsQuery({
    classId: 4471, // Modpacks
    sortField: CurseForgeModsSearchSortField.Popularity,
    sortOrder: CurseForgeSortOrder.Descending,
    pageSize: 4,
  });

  useEffect(() => {
    console.log('width:', width);
    console.log('height:', height);
  }, [height, width]);

  return (
    <div className="flex" style={{ height, width }}>
      <div className="flex-1 p-4 space-y-3 overflow-y-auto">
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

        <div className="grid grid-cols-2 gap-4">
          {modpack?.data.map((modpack) => (
            <Link key={modpack.id} to={''} className="flex flex-col rounded-lg bg-base-100 overflow-hidden">
              <img src={modpack.logo.url} alt={modpack.logo.title} className="object-cover w-full h-44" />

              <div className="space-y-3 p-4 pt-2 relative">
                <img
                  src={modpack.logo.url}
                  alt={modpack.logo.title}
                  className="absolute bottom-[110px] border-base-content/40 border-2 w-20 h-20 rounded-2xl m-0"
                />

                <div className="flex gap-3 items-center ms-24">
                  <p className="font-bold">{modpack.name} </p>
                </div>

                <p className="font-medium text-sm line-clamp-3 text-base-content/80">{modpack.summary}</p>

                <div className="flex items-center gap-1 text-sm">
                  <div className="flex gap-1 items-center">
                    <Download size={20} />
                    <span className="text-nowrap">{abbreviateNumber(modpack.downloadCount)}</span>
                  </div>

                  <div className="divider divider-horizontal m-0"></div>

                  <div className="flex gap-1 items-center">
                    <FileArchive size={20} />
                    <span>{modpack.fileSize}</span>
                  </div>

                  <div className="divider divider-horizontal m-0"></div>

                  <span className="badge badge-soft badge-sm">Modpack</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <SideRightBar />
    </div>
  );
}
