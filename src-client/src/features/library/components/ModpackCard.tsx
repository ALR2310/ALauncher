import { ROUTES } from '@shared/constants/routes';
import { InstanceDto } from '@shared/dtos/instance.dto';
import { InstanceStatusEnum } from '@shared/enums/general.enum';
import { CurseForgeModLoaderType } from 'curseforge-api';
import { ChevronDown, Gamepad2 } from 'lucide-react';
import { memo } from 'react';
import { Link } from 'react-router';
import { useContextSelector } from 'use-context-selector';

import instanceLogo from '~/assets/images/instance-logo.webp';
import Progress from '~/components/Progress';
import { LibraryContext } from '~/context/LibraryContext';

import ModpackActionMenu from './ModpackActionMenu';

const BACKGROUND_IMAGE = import.meta.env.VITE_ENV ? 'https://i.imgur.com/4b1k0aH.png' : instanceLogo;

interface ModpackCardProps {
  id: string;
  name: string;
  version: string;
  loader: InstanceDto['loader'];
  status?: InstanceStatusEnum;
}

function ModpackCardComponent({ id, name, loader, version, status }: ModpackCardProps) {
  const { getState, launch, cancel, update } = useContextSelector(LibraryContext, (v) => v);

  const state = getState(id);
  const isRunning = state?.isRunning;
  const isDownloading = state?.isDownloading;
  const isUpdating = state?.isUpdating;
  const progress = state?.progress;
  const extract = state?.extract;
  const patch = state?.patch;
  const estimated = state?.estimated;
  const speed = state?.speed;

  return (
    <div className="relative group h-60 overflow-hidden bg-base-100 rounded-xl">
      <Link
        to={ROUTES.library.detail(id)}
        className="absolute inset-0"
        tabIndex={0}
        style={{
          backgroundImage: `url(${BACKGROUND_IMAGE})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="flex items-center gap-2 absolute top-0 right-0 bg-base-300/60 m-1 p-1 rounded-box">
          <Gamepad2 size={20} />
          {`${loader ? CurseForgeModLoaderType[loader.type] : 'Release'} ${version}`}
        </div>
      </Link>

      <div
        className={`absolute left-0 right-0 bottom-0 w-full p-2 bg-base-300/60 space-y-3 transform transition-transform duration-300 ${!isRunning && 'translate-y-[calc(100%-40px)]'} group-hover:translate-y-0 group-focus:translate-y-0`}
      >
        <p className="font-semibold">{name}</p>
        <div className="h-10 w-full">
          {isDownloading ? (
            <button
              className="btn btn-ghost w-full px-0"
              onClick={(e) => {
                e.preventDefault();
                cancel(id);
              }}
            >
              <Progress
                className="h-full w-full"
                value={progress}
                text={
                  patch ? (
                    <div className="w-full">
                      <p>Patching...</p>
                      <p className="line-clamp-1">{patch}</p>
                    </div>
                  ) : extract ? (
                    <div className="w-full">
                      <p>Extracting...</p>
                      <p className="line-clamp-1">{extract}</p>
                    </div>
                  ) : estimated && speed ? (
                    <div className="w-full">
                      <p>Downloading...{`${progress ?? 0}%`}</p>
                      <p className="line-clamp-1">{`${estimated} - ${speed}`}</p>
                    </div>
                  ) : null
                }
              />
            </button>
          ) : (
            <div className="join">
              {status === InstanceStatusEnum.UpdateAvailable ? (
                <button className="btn btn-success join-item w-full" onClick={() => update(id)} disabled={isUpdating}>
                  {isUpdating && <span className="loading loading-spinner"></span>}
                  {isUpdating ? 'Updating...' : 'Update'}
                </button>
              ) : (
                <button
                  className={`btn btn-success join-item w-full ${isRunning ? 'btn-soft' : ''}`}
                  onClick={() => {
                    if (isRunning) cancel(id);
                    else launch(id);
                  }}
                >
                  {isRunning ? 'Cancel' : 'Launch'}
                </button>
              )}

              <div className="dropdown dropdown-top dropdown-end">
                <button className="btn btn-success join-item">
                  <ChevronDown size={16} />
                </button>
                <ModpackActionMenu className="bg-base-100 rounded-box z-1 min-w-40 p-2 shadow-sm" instanceId={id} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export const ModpackCard = memo(ModpackCardComponent);
