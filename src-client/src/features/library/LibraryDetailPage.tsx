import { CurseForgeModLoaderType } from 'curseforge-api';
import { formatDistanceToNow } from 'date-fns';
import { EllipsisVertical, FolderOpen, Gamepad2, History, SquarePen } from 'lucide-react';
import { useParams } from 'react-router';

import instanceLogo from '~/assets/images/instance-logo.webp';
import Img from '~/components/Img';
import Progress from '~/components/Progress';
import { useInstanceOneQuery } from '~/hooks/api/useInstanceApi';

export default function LibraryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: instance } = useInstanceOneQuery(id!);

  const isRunning = false;

  if (instance)
    return (
      <div className="flex-1 flex flex-col p-4 space-y-4">
        {/* Header */}
        <div className="flex gap-4 rounded-xl bg-base-100 border border-base-content/20 p-3">
          <Img src={instanceLogo} alt={instance.name} className="w-16 h-16 object-cover" />
          <div className="flex-1 flex flex-col justify-between">
            <div className="flex w-full justify-between">
              <p className="text-lg font-bold">{instance.name}</p>

              <div className="flex gap-2">
                <button className="btn btn-sm btn-success w-24">Play</button>
                <div className="dropdown dropdown-end">
                  <button className="btn btn-sm btn-soft btn-circle">
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
                  {instance.loader ? CurseForgeModLoaderType[instance.loader.type] : 'Release'} - {instance.version}
                </p>

                <div className="divider divider-horizontal mx-3"></div>

                <History size={20} />
                <p>
                  {instance.lastPlayed
                    ? formatDistanceToNow(new Date(instance.lastPlayed), { addSuffix: true })
                    : 'Never played'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex-1 flex flex-col gap-1">
          <div className="tabs tabs-border">
            <input type="radio" name="my_tabs_1" className="tab" aria-label="Tab 1" />
            <input type="radio" name="my_tabs_1" className="tab" aria-label="Tab 2" defaultChecked />
            <input type="radio" name="my_tabs_1" className="tab" aria-label="Tab 3" />
          </div>

          <div className="flex-1 bg-base-100 rounded-xl"></div>
        </div>
      </div>
    );
}
