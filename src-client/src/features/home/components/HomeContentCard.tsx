import { ContentResponseDto } from '@shared/dtos/content.dto';
import { abbreviateNumber } from '@shared/utils/general.utils';
import { ChevronRight, Download, FileArchive } from 'lucide-react';
import { Link } from 'react-router';

import { Img } from '~/components/Img';

interface HomeContentCardProps {
  title: string;
  data: ContentResponseDto['data'];
  isLoading: boolean;
  loadingCount?: number;
}

export function HomeContentCard({ title, data, isLoading, loadingCount = 0 }: HomeContentCardProps) {
  const displayData: ContentResponseDto['data'] = isLoading ? Array.from({ length: loadingCount }) : data;

  return (
    <div className="space-y-4">
      <div className="flex">
        <div className="flex items-center group">
          <Link
            to=""
            className="leading-2 text-xl font-semibold relative after:content-[''] after:absolute after:left-0 after:top-[12px] after:w-0 after:h-[2px] after:bg-success after:transition-all after:duration-300 group-hover:after:w-full"
          >
            {title}
          </Link>
          <ChevronRight
            size={16}
            strokeWidth={3}
            className="transition-all duration-300 group-hover:text-success group-hover:translate-x-1"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {displayData.map((item, idx) => (
          <Link
            key={idx}
            to={''}
            className="flex flex-col rounded-lg bg-base-100 border border-base-content/10 shadow overflow-hidden hover:opacity-80 transition-opacity duration-200"
          >
            <div className="relative w-full h-[165px]">
              {isLoading ? (
                <div className="skeleton w-full h-[165px]"></div>
              ) : (
                <Img src={item.logo.url} alt={item.logo.title} className="object-cover w-full h-full" />
              )}

              {isLoading ? (
                <div className="skeleton absolute left-3 top-32 border-4 border-base-content/70 w-20 h-20 rounded-2xl m-0"></div>
              ) : (
                <Img
                  src={item.logo.url}
                  alt={item.logo.title}
                  className="absolute left-3 top-32 border-4 border-base-content/70 w-20 h-20 rounded-2xl m-0"
                />
              )}
            </div>

            <div className="flex flex-col justify-between p-4 gap-2 pt-2 h-full">
              <div className="flex gap-3 items-center ms-22 h-12">
                {isLoading ? (
                  <div className="skeleton h-6 w-full"></div>
                ) : (
                  <p className="font-bold line-clamp-2">{item.name}</p>
                )}
              </div>

              {isLoading ? (
                <div className="skeleton h-14 w-full"></div>
              ) : (
                <p className="font-medium text-sm line-clamp-3 text-base-content/80">{item.summary}</p>
              )}

              <div className="flex items-center gap-1 text-xs">
                <div className="flex gap-1 items-center">
                  <Download size={20} />
                  {isLoading ? (
                    <div className="skeleton w-12 h-4"></div>
                  ) : (
                    <span className="text-nowrap">{abbreviateNumber(item.downloadCount)}</span>
                  )}
                </div>

                <div className="divider divider-horizontal m-0"></div>

                <div className="flex gap-1 items-center text-nowrap">
                  <FileArchive size={20} />
                  {isLoading ? <div className="skeleton w-12 h-4"></div> : <span>{item.fileSize}</span>}
                </div>

                <div className="divider divider-horizontal m-0"></div>

                {isLoading ? (
                  <div className="skeleton w-16 h-4"></div>
                ) : (
                  <span className="badge badge-soft badge-sm">Modpack</span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
