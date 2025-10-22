import { CATEGORY_CLASS_REVERSED } from '@shared/constants/curseforge.const';
import { ROUTES } from '@shared/constants/routes';
import { categoryMap } from '@shared/dtos/category.dto';
import { ContentDto, ContentInstanceStatus } from '@shared/dtos/content.dto';
import { abbreviateNumber } from '@shared/utils/general.utils';
import { CalendarDays, Download, Gamepad2, HardDrive } from 'lucide-react';
import { memo, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';

import Img from '~/components/Img';
import Progress from '~/components/Progress';
import { useInstanceAddContentSSE } from '~/hooks/api/useInstanceApi';

interface ContentCardProps {
  data: ContentDto;
  gameVersion?: string;
  categoryType?: number;
  instanceId?: string;
}

function ContentCard({ data, gameVersion, categoryType, instanceId }: ContentCardProps) {
  const formattedDate = useMemo(() => new Date(data.dateModified).toLocaleDateString(), [data.dateModified]);
  const categoryName = useMemo(() => categoryMap.idToText[data.classId ?? 0], [data.classId]);
  const { addContent, progress, isDownloading, estimated, speed } = useInstanceAddContentSSE();
  const [status, setStatus] = useState<string>();
  const contentType = useMemo(() => {
    return CATEGORY_CLASS_REVERSED[categoryType ?? 0]?.toLowerCase().replace(' ', '');
  }, [categoryType]);

  useEffect(() => {
    switch (data.instance?.status) {
      case ContentInstanceStatus.INSTALLED:
        setStatus('Installed');
        break;
      case ContentInstanceStatus.OUTDATED:
        setStatus('Update');
        break;
      case ContentInstanceStatus.INCOMPATIBLE:
        setStatus('Incompatible');
        break;
      default:
        setStatus('Install');
    }
  }, [data.instance?.status]);

  return (
    <div className="flex gap-4 p-3 h-[120px] bg-base-100 rounded-box">
      <Link to={ROUTES.discover.detail(data.slug)} className="flex justify-center items-center w-24 h-24">
        <Img src={data.logo.thumbnailUrl} alt={data.logo.title} className="w-full h-full object-cover" />
      </Link>

      <div className="flex-1 justify-between">
        <div className="flex">
          <div className="flex-4/5 space-y-1">
            <Link
              to={ROUTES.discover.detail(data.slug)}
              className="w-[90%] text-lg line-clamp-1 font-semibold text-base-content/70 hover:link hover:link-success!"
            >
              {data.name}
            </Link>

            <div className="text-sm text-base-content/50 line-clamp-1 w-[90%]">{data.summary}</div>
          </div>
          <div className="flex-1/5">
            <button
              className={`btn btn-success btn-block ${status === 'Installed' ? 'btn-soft' : ''} ${status === 'Update' ? 'btn-outline' : ''} ${isDownloading || status === 'Installed' ? 'pointer-events-none' : ''}`}
              onClick={() => addContent({ id: instanceId ?? 'todo', contentId: data.id, contentType, worlds: '' })}
            >
              {status}
            </button>
          </div>
        </div>

        <div className="divider m-0"></div>

        {isDownloading ? (
          <Progress
            className="h-5"
            value={progress}
            text={`${progress ?? 0}% ${estimated ? `(${estimated})` : ''} ${speed ? `- ${speed}` : ''}`}
          />
        ) : (
          <div className="flex justify-between">
            <div>
              <button className="btn btn-xs btn-outline">{categoryName}</button>
            </div>

            <div className="flex gap-1 text-sm text-base-content/50">
              <div className="flex items-center gap-1">
                <Download size={16} />
                {abbreviateNumber(data.downloadCount)}
              </div>

              <div className="divider divider-horizontal m-0"></div>

              <div className="flex items-center gap-1">
                <CalendarDays size={16} />
                {formattedDate}
              </div>

              <div className="divider divider-horizontal m-0"></div>

              <div className="flex items-center gap-1">
                <HardDrive size={16} />
                {data.fileSize}
              </div>

              <div className="divider divider-horizontal m-0"></div>

              <div className="flex items-center gap-1">
                <Gamepad2 size={16} />
                {gameVersion || data.gameVersions[0]}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(ContentCard);
