import { createContext, useRef, useState } from 'react';

import LibraryModal from '~/layouts/LibraryModal';

interface LibraryModalContextValue {
  open(id?: string): void;
  close(): void;
}

const LibraryModalContext = createContext<LibraryModalContextValue>(undefined!);

function LibraryModalProvider({ children }: { children: React.ReactNode }) {
  const dialogRef = useRef<HTMLDialogElement>(null!);
  const [id, setId] = useState<string | undefined>();

  const open = (id?: string) => {
    setId(id);
    dialogRef.current?.showModal();
  };

  const close = () => {
    dialogRef.current?.close();
    setId(undefined);
  };

  return (
    <LibraryModalContext.Provider value={{ open, close }}>
      {children}
      <LibraryModal ref={dialogRef} id={id} />
    </LibraryModalContext.Provider>
  );
}

export { LibraryModalContext, LibraryModalProvider };
