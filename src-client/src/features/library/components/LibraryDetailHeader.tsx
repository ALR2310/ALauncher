import { ROUTES } from '@shared/constants/routes';
import { InstanceDto } from '@shared/dtos/instance.dto';
import { useQueryClient } from '@tanstack/react-query';
import { CurseForgeModLoaderType } from 'curseforge-api';
import { formatDistanceToNow } from 'date-fns';
import { EllipsisVertical, FolderOpen, Gamepad2, History, SquarePen, Trash2 } from 'lucide-react';
import { memo } from 'react';
import { useNavigate } from 'react-router';
import { useContextSelector } from 'use-context-selector';

import { instanceOpenFolder } from '~/api';
import instanceLogo from '~/assets/images/instance-logo.webp';
import Img from '~/components/Img';
import Progress from '~/components/Progress';
import { LibraryContext } from '~/context/LibraryContext';
import { LibraryModalContext } from '~/context/LibraryModalContext';
import { useInstanceDeleteMutation } from '~/hooks/api/useInstanceApi';
import { toast } from '~/hooks/app/useToast';

interface LibraryDetailHeaderProps {
  data: InstanceDto | undefined;
  isLoading?: boolean;
}

const LibraryDetailHeader = memo(({ data, isLoading }: LibraryDetailHeaderProps) => {
  const navigation = useNavigate();

  const instanceModal = useContextSelector(LibraryModalContext, (v) => v);
  const { launch, cancel, getState } = useContextSelector(LibraryContext, (v) => v);

  const state = getState(data?.id || '');
  const isRunning = state?.isRunning;
  const isDownloading = state?.isDownloading;
  const progress = state?.progress;
  const estimated = state?.estimated;
  const speed = state?.speed;

  const { mutateAsync: deleteInstance } = useInstanceDeleteMutation();
  const queryClient = useQueryClient();

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

            <div className="dropdown dropdown-end">
              <button className="btn btn-soft btn-circle">
                <EllipsisVertical />
              </button>
              <ul tabIndex={-1} className="dropdown-content menu bg-base-200 rounded-box z-1 min-w-38 shadow mt-3">
                <li>
                  <button onClick={() => instanceOpenFolder(data!.id)}>
                    <FolderOpen size={16} />
                    Open folder
                  </button>
                </li>
                <li>
                  <button onClick={() => instanceModal.open(data?.id)}>
                    <SquarePen size={16} />
                    Edit instance
                  </button>
                </li>
                <li>
                  <button
                    className="text-nowrap"
                    onClick={async () => {
                      try {
                        await deleteInstance(data!.id);
                        toast.success('Instance deleted');
                        queryClient.invalidateQueries({ queryKey: ['instances'] });
                        navigation(ROUTES.library.path);
                      } catch {
                        console.error('Failed to delete instance');
                        toast.error('Failed to delete instance');
                      }
                    }}
                  >
                    <Trash2 size={16} />
                    Delete instance
                  </button>
                </li>
              </ul>
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
