import { categoryMap } from '@shared/dtos/category.dto';
import { ContentDto } from '@shared/dtos/content.dto';
import { abbreviateNumber } from '@shared/utils/general.utils';
import { CalendarDays, Download, Gamepad2, HardDrive } from 'lucide-react';
import { Link } from 'react-router';

import Img from '~/components/Img';

interface ContentCardProps {
  data: ContentDto;
}

export default function ContentCard({ data }: ContentCardProps) {
  return (
    <Link to={''} key={data.id} className="flex gap-4 p-3 h-[120px] bg-base-100 rounded-box">
      <div className="flex justify-center items-center w-24 h-24">
        <Img src={data.logo.thumbnailUrl} alt={data.logo.title} className="w-full h-full object-cover" />
      </div>

      <div className="flex-1 justify-between">
        <div className="flex">
          <div className="flex-4/5 space-y-1">
            <div className="flex w-[90%]">
              <Link
                to={`/discover/${data.slug}`}
                className="text-lg line-clamp-1 font-semibold text-base-content/70 hover:link hover:link-success!"
              >
                {data.name}
              </Link>

              <div className="divider divider-horizontal"></div>

              <Link
                to={`/discover/${data.authors[0]?.id}`}
                className="text-lg line-clamp-1 font-semibold text-base-content/70 hover:link hover:link-success!"
              >
                {data.authors[0]?.name}
              </Link>
            </div>

            <div className="text-sm text-base-content/50 line-clamp-1 w-[90%]">{data.summary}</div>
          </div>
          <div className="flex-1/5">
            <button className="btn btn-success btn-block">Install</button>
          </div>
        </div>

        <div className="divider m-0"></div>

        <div className="flex justify-between">
          <div>
            <button className="btn btn-xs btn-outline">{categoryMap.idToText[data.classId ?? 0]}</button>
          </div>

          <div className="flex gap-1 text-sm text-base-content/50">
            <div className="flex items-center gap-1">
              <Download size={16} />
              {abbreviateNumber(data.downloadCount)}
            </div>

            <div className="divider divider-horizontal m-0"></div>

            <div className="flex items-center gap-1">
              <CalendarDays size={16} />
              {new Date(data.dateModified).toLocaleDateString()}
            </div>

            <div className="divider divider-horizontal m-0"></div>

            <div className="flex items-center gap-1">
              <HardDrive size={16} />
              {data.fileSize}
            </div>

            <div className="divider divider-horizontal m-0"></div>

            <div className="flex items-center gap-1">
              <Gamepad2 size={16} />
              {data.gameVersions[0]}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
