import { CurseForgeModLoaderType } from 'curseforge-api';
import { Gamepad2 } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';

import instanceLogo from '~/assets/images/instance-logo.webp';
import Progress from '~/components/Progress';
import { useInstancesQuery } from '~/hooks/api/useInstanceApi';

export default function LibraryPage() {
  const { data: instances } = useInstancesQuery();

  const [instanceActive, setInstanceActive] = useState<string | null>(null);

  const handlePlay = (id: string) => {
    setInstanceActive(id);

    setTimeout(() => {
      setInstanceActive(null);
    }, 1000000);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {instances?.map((instance) => {
          const isRunning = instanceActive === instance.id;

          return (
            <Link
              to={`/library/${instance.id}`}
              key={instance.id}
              className="relative group h-52 overflow-hidden bg-base-100 rounded-xl"
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
                  {isRunning ? (
                    <button className="btn btn-ghost w-full px-0 " onClick={() => console.log('stop')}>
                      <Progress className="h-full w-full" text={`Download ${instance.name}`} />
                    </button>
                  ) : (
                    <button
                      className="btn btn-success w-full"
                      onClick={(e) => {
                        e.preventDefault();
                        handlePlay(instance.id);
                      }}
                    >
                      Play
                    </button>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
