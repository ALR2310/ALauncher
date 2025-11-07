import { ROUTES } from '@shared/constants/routes';
import { InstanceStatusEnum } from '@shared/enums/general.enum';
import { useQueryClient } from '@tanstack/react-query';
import { CurseForgeModLoaderType } from 'curseforge-api';
import { ChevronDown, Copy, FolderOpen, Gamepad2, Trash2, Upload } from 'lucide-react';
import { useCallback } from 'react';
import { Link } from 'react-router';
import { useContextSelector } from 'use-context-selector';

import { instanceOpenFolder } from '~/api';
import instanceLogo from '~/assets/images/instance-logo.webp';
import Progress from '~/components/Progress';
import { LibraryContext } from '~/context/LibraryContext';
import { LibraryModalContext } from '~/context/LibraryModalContext';
import { useInstanceDeleteMutation, useInstancesQuery } from '~/hooks/api/useInstanceApi';
import { useSelectInstance } from '~/hooks/app/useSelectInstance';
import { toast } from '~/hooks/app/useToast';

export default function LibraryList() {
  const { data: instances } = useInstancesQuery();

  const libraryModal = useContextSelector(LibraryModalContext, (ctx) => ctx);
  const { getState, launch, cancel } = useContextSelector(LibraryContext, (v) => v);
  const { selectInstanceFiles } = useSelectInstance();

  const queryClient = useQueryClient();
  const { mutateAsync: deleteInstance, isPending: isDeleting } = useInstanceDeleteMutation();

  const handleUpload = useCallback(
    async (id: string) => {
      const files = await selectInstanceFiles(id);
      console.log('Selected files to upload:', files);
    },
    [selectInstanceFiles],
  );

  return (
    <div className="flex-1 overflow-y-auto p-4">
      {instances && instances.length > 0 ? (
        <div className="grid grid-cols-3 lg:grid-cols-5 gap-6">
          {instances
            .filter((item) => item.status !== InstanceStatusEnum.NotInstalled)
            .map((instance) => {
              const state = getState(instance.id);
              const isRunning = state?.isRunning;
              const isDownloading = state?.isDownloading;
              const progress = state?.progress;
              const extract = state?.extract;
              const patch = state?.patch;
              const estimated = state?.estimated;
              const speed = state?.speed;

              return (
                <div key={instance.id} className="relative group h-60 overflow-hidden bg-base-100 rounded-xl">
                  <Link
                    to={ROUTES.library.detail(instance.id)}
                    className="absolute inset-0"
                    tabIndex={0}
                    style={{
                      backgroundImage: `url(${import.meta.env.VITE_ENV ? 'https://i.imgur.com/4b1k0aH.png' : instanceLogo} )`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  >
                    <div className="flex items-center gap-2 absolute top-0 right-0 bg-base-300/60 m-1 p-1 rounded-box">
                      <Gamepad2 size={20} />
                      {`${instance.loader ? CurseForgeModLoaderType[instance.loader.type] : 'Release'} ${instance.version}`}
                    </div>
                  </Link>

                  <div
                    className={`absolute left-0 right-0 bottom-0 w-full p-2 bg-base-300/60 space-y-3 transform transition-transform duration-300 ${!isRunning && 'translate-y-[calc(100%-40px)]'} group-hover:translate-y-0 group-focus:translate-y-0`}
                  >
                    <p className="font-semibold">{instance.name}</p>
                    <div className="h-10 w-full">
                      {isDownloading ? (
                        <button
                          className="btn btn-ghost w-full px-0"
                          onClick={(e) => {
                            e.preventDefault();
                            cancel(instance.id);
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
                          <button
                            className={`btn btn-success join-item w-full ${isRunning ? 'btn-soft' : ''}`}
                            onClick={() => {
                              if (isRunning) cancel(instance.id);
                              else launch(instance.id);
                            }}
                          >
                            {isRunning ? 'Cancel' : 'Launch'}
                          </button>

                          <div className="dropdown dropdown-top dropdown-end">
                            <button className="btn btn-success join-item">
                              <ChevronDown size={16} />
                            </button>
                            <ul className="menu dropdown-content bg-base-100 rounded-box z-1 min-w-40 p-2 shadow-sm">
                              <li>
                                <button
                                  className="text-error"
                                  disabled={isDeleting}
                                  onClick={() =>
                                    deleteInstance(instance.id)
                                      .catch(() => toast.error('Failed to delete instance'))
                                      .then(() => {
                                        queryClient.invalidateQueries({ queryKey: ['instances'] });
                                        queryClient.invalidateQueries({ queryKey: ['instance', instance.id] });
                                      })
                                  }
                                >
                                  {isDeleting ? <div className="loading loading-spinner"></div> : <Trash2 size={16} />}{' '}
                                  Delete
                                </button>
                              </li>
                              <li>
                                <button onClick={() => instanceOpenFolder(instance.id)}>
                                  <FolderOpen size={16} /> Open Folder
                                </button>
                              </li>
                              <li>
                                <button>
                                  <Copy size={16} /> Duplicate
                                </button>
                              </li>
                              <li>
                                <button onClick={() => handleUpload(instance.id)}>
                                  <Upload size={16} /> Upload
                                </button>
                              </li>
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      ) : (
        <div className="flex flex-col items-center h-full gap-4 pt-[20vh]">
          <div className="text-center space-y-2">
            <Gamepad2 size={64} className="mx-auto opacity-50" />
            <h2 className="text-2xl font-semibold">No Instances Found</h2>
            <p className="text-base-content/70">Create your first instance to get started</p>
          </div>
          <button className="btn btn-success" onClick={() => libraryModal.open()}>
            Create New Instance
          </button>
        </div>
      )}
    </div>
  );
}
