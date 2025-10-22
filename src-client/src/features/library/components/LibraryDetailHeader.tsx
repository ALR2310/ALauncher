import { InstanceDto } from '@shared/dtos/instance.dto';
import { CurseForgeModLoaderType } from 'curseforge-api';
import { formatDistanceToNow } from 'date-fns';
import { EllipsisVertical, FolderOpen, Gamepad2, History, SquarePen } from 'lucide-react';
import { memo } from 'react';
import { useContextSelector } from 'use-context-selector';

import instanceLogo from '~/assets/images/instance-logo.webp';
import Img from '~/components/Img';
import Progress from '~/components/Progress';
import { LibraryModalContext } from '~/context/LibraryModalContext';
import { useInstanceLaunchSSE } from '~/hooks/api/useInstanceApi';

interface LibraryDetailHeaderProps {
  data: InstanceDto;
}

const LibraryDetailHeader = memo(({ data }: LibraryDetailHeaderProps) => {
  const { launch, cancel, isRunning, progress, estimated, speed } = useInstanceLaunchSSE();
  const instanceModal = useContextSelector(LibraryModalContext, (v) => v);

  return (
    <div className="flex rounded-xl bg-base-100 gap-4 p-3 border border-base-content/10">
      <Img src={instanceLogo} alt={data.name} className="w-28 h-24 object-cover" />
      <div className="flex-1 flex flex-col justify-between">
        <div className="flex w-full justify-between">
          <div className="flex-1">
            <p className="line-clamp-2 text-xl font-bold w-[80%]">{data.name}</p>
          </div>

          <div className="flex gap-2">
            <button className="btn btn-success w-28" onClick={() => (isRunning ? cancel(data.id) : launch(data.id))}>
              {isRunning ? 'Cancel' : 'Play'}
            </button>

            <div className="dropdown dropdown-end">
              <button className="btn btn-soft btn-circle">
                <EllipsisVertical />
              </button>
              <ul tabIndex={-1} className="dropdown-content menu bg-base-200 rounded-box z-1 w-38 shadow mt-3">
                <li>
                  <button onClick={() => {}}>
                    <FolderOpen size={16} />
                    Open folder
                  </button>
                </li>
                <li>
                  <button onClick={() => instanceModal.open(data.id)}>
                    <SquarePen size={16} />
                    Edit instance
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="divider m-0"></div>

        {isRunning ? (
          <Progress
            className="w-full h-5"
            value={progress}
            text={`${progress ?? 0}% ${estimated ? `(${estimated})` : ''} ${speed ? `- ${speed}` : ''}`}
          />
        ) : (
          <div className="flex gap-1 items-center text-sm text-base-content/70">
            <Gamepad2 size={20} />
            <p>
              {data.loader ? CurseForgeModLoaderType[data.loader.type] : 'Release'} - {data.version}
            </p>

            <div className="divider divider-horizontal mx-3"></div>

            <History size={20} />
            <p>
              {data.lastPlayed ? formatDistanceToNow(new Date(data.lastPlayed), { addSuffix: true }) : 'Never played'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
});

export default LibraryDetailHeader;
