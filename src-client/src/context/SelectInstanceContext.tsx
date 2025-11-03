import { CurseForgeModLoaderType } from 'curseforge-api';
import { formatDistanceToNow } from 'date-fns';
import { createContext, useEffect, useRef, useState } from 'react';

import instanceLogo from '~/assets/images/instance-logo.webp';
import Img from '~/components/Img';
import { Modal } from '~/components/Modals';
import { useInstancesQuery } from '~/hooks/api/useInstanceApi';

interface SelectInstanceContextType {
  selectInstance: () => Promise<string | null>;
}

const SelectInstanceContext = createContext<SelectInstanceContextType>(null!);

const SelectInstanceProvider = ({ children }: { children: React.ReactNode }) => {
  const modalRef = useRef<HTMLDialogElement>(null!);
  const [resolver, setResolver] = useState<(id: string | null) => void>();

  const { data: instances } = useInstancesQuery({ sortBy: 'lastPlayed' });

  const selectInstance = () => {
    return new Promise<string | null>((resolve) => {
      setResolver(() => resolve);
      modalRef.current?.showModal();
    });
  };

  const handleSelect = (id: string) => {
    resolver?.(id);
    setResolver(undefined);
    modalRef.current?.close();
  };

  useEffect(() => {
    const modal = modalRef.current;
    if (!modal) return;

    const onClose = () => {
      if (resolver) {
        resolver(null);
        setResolver(undefined);
      }
    };

    modal.addEventListener('close', onClose);
    return () => modal.removeEventListener('close', onClose);
  }, [resolver]);

  return (
    <SelectInstanceContext.Provider value={{ selectInstance }}>
      {children}
      <Modal
        ref={modalRef}
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
              onClick={() => handleSelect(instance.id)}
            >
              <Img src={instanceLogo} alt={instance.name} className="h-20 w-20 object-cover" />

              <div className="flex flex-col">
                <p className="text-lg font-semibold">{instance.name}</p>

                <div className="flex gap-2">
                  <span>Version: {instance.version}</span>
                  <div className="divider divider-horizontal"></div>
                  <span>Type: {instance.loader ? `${CurseForgeModLoaderType[instance.loader.type]}` : 'Release'}</span>
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
    </SelectInstanceContext.Provider>
  );
};

export { SelectInstanceContext, SelectInstanceProvider };
export type { SelectInstanceContextType };
