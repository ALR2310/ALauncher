import { ROUTES } from '@shared/constants/routes';
import { categoryMap } from '@shared/dtos/category.dto';
import { ContentDto, ContentInstanceStatus } from '@shared/dtos/content.dto';
import { abbreviateNumber } from '@shared/utils/general.utils';
import { useQueryClient } from '@tanstack/react-query';
import { CalendarDays, Download, Gamepad2, HardDrive } from 'lucide-react';
import { memo, useCallback, useEffect, useMemo } from 'react';
import { Link } from 'react-router';

import Img from '~/components/Img';
import Progress from '~/components/Progress';
import { useInstanceAddContentSSE } from '~/hooks/api/useInstanceApi';
import { toast } from '~/hooks/app/useToast';

interface ContentCardProps {
  data: ContentDto;
  gameVersion?: string;
  categoryType?: number;
  instanceId?: string;
}

function ContentCard({ data, gameVersion, instanceId }: ContentCardProps) {
  const queryClient = useQueryClient();
  const formattedDate = useMemo(() => new Date(data.dateModified).toLocaleDateString(), [data.dateModified]);
  const categoryName = useMemo(() => categoryMap.idToText[data.classId ?? 0], [data.classId]);
  const { addContent, progress, isDownloading, estimated, speed, isDone } = useInstanceAddContentSSE();

  const status = useMemo(() => {
    switch (data.instance?.status) {
      case ContentInstanceStatus.INSTALLED:
        return 'Installed';
      case ContentInstanceStatus.OUTDATED:
        return 'Update';
      case ContentInstanceStatus.INCOMPATIBLE:
        return 'Incompatible';
      default:
        return 'Install';
    }
  }, [data.instance?.status]);

  const buttonClassName = useMemo(() => {
    const classes = ['btn', 'btn-success', 'btn-block'];

    if (status === 'Installed') classes.push('btn-soft');
    if (status === 'Update') classes.push('btn-outline');
    if (isDownloading || status === 'Installed') classes.push('pointer-events-none');

    return classes.join(' ');
  }, [status, isDownloading]);

  // Invalidate contents query to refresh status
  useEffect(() => {
    if (isDone && instanceId) {
      queryClient.invalidateQueries({ queryKey: ['contents'] });
    }
  }, [isDone, instanceId, queryClient]);

  const handleAddContent = useCallback(() => {
    if (!instanceId) return toast.warning('Please select an instance to add content to.');

    addContent({ id: instanceId, contentId: data.id, worlds: undefined });
  }, [addContent, data.id, instanceId]);

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
              className={buttonClassName}
              onClick={handleAddContent}
              title={isDownloading || status === 'Installed' ? 'Action not available' : status}
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
