import { InstanceDto } from '@shared/dtos/instance.dto';
import { CurseForgeModLoaderType } from 'curseforge-api';
import { formatDistanceToNow } from 'date-fns';
import { EllipsisVertical, FolderOpen, Gamepad2, History, SquarePen } from 'lucide-react';

import instanceLogo from '~/assets/images/instance-logo.webp';
import Img from '~/components/Img';
import Progress from '~/components/Progress';

interface LibraryDetailHeaderProps {
  data: InstanceDto;
}

export default function LibraryDetailHeader({ data }: LibraryDetailHeaderProps) {
  const isRunning = false;

  return (
    <div className="flex rounded-xl bg-base-100 border border-base-content/10 overflow-hidden">
      <Img src={instanceLogo} alt={data.name} className="w-28 h-24 object-cover" />
      <div className="flex-1 flex flex-col justify-between p-3">
        <div className="flex w-full justify-between">
          <p className="text-xl font-bold">{data.name}</p>

          <div className="flex gap-2">
            <button className="btn btn-success w-28">Play</button>

            <div className="dropdown dropdown-end">
              <button className="btn btn-soft btn-circle">
                <EllipsisVertical />
              </button>
              <ul tabIndex={-1} className="dropdown-content menu bg-base-200 rounded-box z-1 w-38 shadow mt-3">
                <li>
                  <a>
                    <FolderOpen size={16} />
                    Open folder
                  </a>
                </li>
                <li>
                  <a>
                    <SquarePen size={16} />
                    Edit instance
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {isRunning ? (
          <Progress className="w-full h-5" />
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
}
