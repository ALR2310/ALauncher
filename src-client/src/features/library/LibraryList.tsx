import { ROUTES } from '@shared/constants/routes';
import { CurseForgeModLoaderType } from 'curseforge-api';
import { Gamepad2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useContextSelector } from 'use-context-selector';

import instanceLogo from '~/assets/images/instance-logo.webp';
import Progress from '~/components/Progress';
import { LibraryContext } from '~/context/LibraryContext';
import { LibraryModalContext } from '~/context/LibraryModalContext';
import { useInstancesQuery } from '~/hooks/api/useInstanceApi';

export default function LibraryList() {
  const { data: instances } = useInstancesQuery();

  const libraryModal = useContextSelector(LibraryModalContext, (ctx) => ctx);
  const { getState, launch, cancel } = useContextSelector(LibraryContext, (v) => v);

  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length < 3 ? prev + '.' : ''));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex-1 overflow-y-auto p-4">
      {instances && instances.length > 0 ? (
        <div className="grid grid-cols-3 lg:grid-cols-5 gap-6">
          {instances.map((instance) => {
            const state = getState(instance.id);
            const isRunning = state?.isRunning;
            const isDownloading = state?.isDownloading;
            const progress = state?.progress;
            const extract = state?.extract;
            const estimated = state?.estimated;
            const speed = state?.speed;

            return (
              <Link
                to={ROUTES.library.detail(instance.id)}
                key={instance.id}
                className="relative group h-60 overflow-hidden bg-base-100 rounded-xl"
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
                            <div className="w-full">
                              <p>
                                {`Launching${dots}`} {`${progress}%`}
                              </p>
                              {extract ? (
                                <p className="line-clamp-1">{extract}</p>
                              ) : estimated && speed ? (
                                <p className="line-clamp-1">{`${estimated} - ${speed}`}</p>
                              ) : null}
                            </div>
                          }
                        />
                      </button>
                    ) : (
                      <button
                        className={`btn btn-success w-full ${isRunning ? 'btn-soft' : ''}`}
                        onClick={(e) => {
                          e.preventDefault();
                          if (isRunning) cancel(instance.id);
                          else launch(instance.id);
                        }}
                      >
                        {isRunning ? 'Cancel' : 'Launch'}
                      </button>
                    )}
                  </div>
                </div>
              </Link>
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
