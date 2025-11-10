import { InstanceDto } from '@shared/dtos/instance.dto';
import { CurseForgeModLoaderType } from 'curseforge-api';
import { formatDistanceToNow } from 'date-fns';
import { createContext, RefObject, useEffect, useRef, useState } from 'react';

import instanceLogo from '~/assets/images/instance-logo.webp';
import Img from '~/components/Img';
import { Modal } from '~/components/Modals';
import { useInstancesQuery } from '~/hooks/api/useInstanceApi';

interface InstanceSelectContextType {
  selectInstance: () => Promise<string | null>;
}

const InstanceSelectContext = createContext<InstanceSelectContextType>(null!);

const InstanceSelectProvider = ({ children }: { children: React.ReactNode }) => {
  const instanceModalRef = useRef<HTMLDialogElement>(null!);

  const [instanceResolver, setInstanceResolver] = useState<(id: string | null) => void>();

  const { data: instances } = useInstancesQuery();

  const selectInstance = () =>
    new Promise<string | null>((resolve) => {
      setInstanceResolver(() => resolve);
      instanceModalRef.current?.showModal();
    });

  const handleSelectInstance = (id: string) => {
    instanceResolver?.(id);
    setInstanceResolver(undefined);
    instanceModalRef.current?.close();
  };

  useEffect(() => {
    const modal = instanceModalRef.current;
    if (!modal) return;
    const onClose = () => {
      if (instanceResolver) {
        instanceResolver(null);
        setInstanceResolver(undefined);
      }
    };
    modal.addEventListener('close', onClose);
    return () => modal.removeEventListener('close', onClose);
  }, [instanceResolver]);

  return (
    <InstanceSelectContext.Provider value={{ selectInstance }}>
      {children}

      <ModalSelectInstance ref={instanceModalRef} instances={instances || []} resolve={handleSelectInstance} />
    </InstanceSelectContext.Provider>
  );
};

const ModalSelectInstance = ({
  ref,
  instances,
  resolve,
}: {
  ref: RefObject<HTMLDialogElement>;
  instances: InstanceDto[];
  resolve: (id: string) => void;
}) => {
  return (
    <Modal
      ref={ref}
      title={<p className="text-center block">Select Instance</p>}
      buttonCancel={{ show: false }}
      buttonSubmit={{ show: false }}
    >
      <div className="grid grid-cols-1 gap-4">
        {instances?.map((instance) => (
          <div
            key={instance.id}
            className="flex gap-4 bg-base-200 p-4 rounded-md cursor-pointer hover:outline-2 outline-offset-2 isolate hover:outline-success"
            tabIndex={1}
            onClick={() => resolve(instance.id)}
          >
            <Img src={instanceLogo} alt={instance.name} className="h-20 w-20 object-cover" />

            <div className="flex flex-col">
              <p className="text-lg font-semibold">{instance.name}</p>

              <div className="flex gap-2">
                <span>Version: {instance.version}</span>
                <div className="divider divider-horizontal"></div>
                <span>Type: {instance.loader ? CurseForgeModLoaderType[instance.loader.type] : 'Release'}</span>
              </div>

              <p>
                Last Played:{' '}
                {instance.lastPlayed
                  ? formatDistanceToNow(new Date(instance.lastPlayed), { addSuffix: true })
                  : 'Never played'}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
};

export { InstanceSelectContext, InstanceSelectProvider };
export type { InstanceSelectContextType };
