import { InstanceStatusEnum } from '@shared/enums/general.enum';
import { Gamepad2 } from 'lucide-react';
import { useContextSelector } from 'use-context-selector';

import { LibraryModalContext } from '~/context/LibraryModalContext';
import { useInstancesQuery } from '~/hooks/api/useInstanceApi';

import { ModpackCard } from './components/ModpackCard';

export default function LibraryList() {
  const { data: instances, isLoading } = useInstancesQuery({ checkStatus: true });

  const libraryModal = useContextSelector(LibraryModalContext, (ctx) => ctx);

  if (isLoading)
    return (
      <div className="flex-1 p-4 overflow-y-auto grid grid-cols-3 lg:grid-cols-5 gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="skeleton h-60 w-full bg-base-200 rounded-xl" />
        ))}
      </div>
    );

  return (
    <div className="flex-1 overflow-y-auto p-4">
      {instances && instances.length > 0 ? (
        <div className="grid grid-cols-3 lg:grid-cols-5 gap-6">
          {instances
            .filter((item) => item.status !== InstanceStatusEnum.NotInstalled)
            .map((instance) => (
              <ModpackCard
                key={instance.id}
                id={instance.id}
                name={instance.name}
                version={instance.version}
                loader={instance.loader}
              />
            ))}
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
