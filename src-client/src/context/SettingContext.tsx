import { useRef } from 'react';
import { createContext } from 'use-context-selector';

import { Modal } from '~/components/Modals';
import SettingView from '~/features/setting/SettingView';

interface SettingContextType {
  open: () => void;
  close: () => void;
}

const SettingContext = createContext<SettingContextType>(null!);

function SettingProvider({ children }: { children: React.ReactNode }) {
  const modalRef = useRef<HTMLDialogElement>(null!);

  const open = () => modalRef.current?.showModal();
  const close = () => modalRef.current?.close();

  return (
    <SettingContext.Provider value={{ open, close }}>
      {children}
      <Modal
        ref={modalRef}
        title={<p className="text-center">Setting</p>}
        buttonCancel={{ show: false }}
        buttonSubmit={{ show: false }}
      >
        <SettingView />
      </Modal>
    </SettingContext.Provider>
  );
}

export { SettingContext, SettingProvider };
