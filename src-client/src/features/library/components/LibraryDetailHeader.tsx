import { InstanceDto } from '@shared/dtos/instance.dto';
import { InstanceStatusEnum } from '@shared/enums/general.enum';
import { CurseForgeModLoaderType } from 'curseforge-api';
import { formatDistanceToNow } from 'date-fns';
import { EllipsisVertical, Gamepad2, History } from 'lucide-react';
import { memo } from 'react';
import { useContextSelector } from 'use-context-selector';

import instanceLogo from '~/assets/images/instance-logo.webp';
import Img from '~/components/Img';
import Progress from '~/components/Progress';
import { LibraryContext } from '~/context/LibraryContext';

import ModpackActionMenu from './ModpackActionMenu';

interface LibraryDetailHeaderProps {
  data: InstanceDto | undefined;
  isLoading?: boolean;
}

const LibraryDetailHeader = memo(({ data, isLoading }: LibraryDetailHeaderProps) => {
  const { launch, cancel, getState, update } = useContextSelector(LibraryContext, (v) => v);

  const state = getState(data?.id || '');
  const isRunning = state?.isRunning;
  const isDownloading = state?.isDownloading;
  const isUpdating = state?.isUpdating;
  const progress = state?.progress;
  const estimated = state?.estimated;
  const speed = state?.speed;

  return (
    <div className="flex rounded-xl bg-base-100 gap-4 p-3 border border-base-content/10">
      {isLoading ? (
        <div className="skeleton w-28 h-24"></div>
      ) : (
        <Img src={instanceLogo} alt={data?.name} className="w-28 h-24 object-cover" />
      )}

      <div className="flex-1 flex flex-col justify-between">
        <div className="flex w-full justify-between">
          <div className="flex-1">
            {isLoading ? (
              <div className="skeleton h-5 w-[80%]" />
            ) : (
              <p className="line-clamp-2 text-xl font-bold w-[80%]">{data?.name}</p>
            )}
          </div>

          <div className="flex gap-2">
            {data?.status === InstanceStatusEnum.UpdateAvailable ? (
              <button className="btn btn-success w-28" onClick={() => update(data.id)} disabled={isUpdating}>
                {isUpdating && <span className="loading loading-spinner"></span>}
                {isUpdating ? 'Updating...' : 'Update'}
              </button>
            ) : (
              <button
                className={`btn btn-success w-28 ${isRunning ? 'btn-outline' : ''}`}
                onClick={() => {
                  if (isRunning && data?.id) {
                    cancel(data.id);
                  } else if (data?.id) {
                    launch(data.id);
                  }
                }}
              >
                {isRunning ? 'Cancel' : 'Play'}
              </button>
            )}

            <div className="dropdown dropdown-end z-10">
              <button className="btn btn-soft btn-circle">
                <EllipsisVertical />
              </button>

              <ModpackActionMenu
                className="bg-base-200 rounded-box z-1 min-w-40 shadow mt-3"
                instanceId={data?.id ?? ''}
              />
            </div>
          </div>
        </div>

        <div className="divider m-0"></div>

        {isLoading ? (
          <div className="skeleton w-full h-5"></div>
        ) : isDownloading ? (
          <Progress
            className="w-full h-5"
            value={progress}
            text={`${progress ?? 0}% ${estimated ? `(${estimated})` : ''} ${speed ? `- ${speed}` : ''}`}
          />
        ) : (
          <div className="flex gap-1 items-center text-sm text-base-content/70">
            <Gamepad2 size={20} />
            <p>
              {data?.loader ? CurseForgeModLoaderType[data.loader.type] : 'Release'} - {data?.version}
            </p>

            <div className="divider divider-horizontal mx-3"></div>

            <History size={20} />
            <p>
              {data?.lastPlayed ? formatDistanceToNow(new Date(data.lastPlayed), { addSuffix: true }) : 'Never played'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
});

export default LibraryDetailHeader;
