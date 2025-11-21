import { useEffect, useState } from 'react';

import { Modal } from '~/components/Modals';

import { confirmBus, ConfirmEvents } from './confirmBus';

export function ConfirmContainer() {
  const [data, setData] = useState<ConfirmEvents['open'] | null>(null);
  const open = data !== null;

  useEffect(() => {
    confirmBus.on('open', (payload) => {
      setData(payload);
    });
  }, []);

  const handleClose = (result: boolean) => {
    data?.resolve(result);
    setData(null);
  };

  return (
    <Modal
      modalClassName={open ? 'modal-open' : ''}
      title={data?.title}
      buttonSubmit={{ show: true, onClick: () => handleClose(true) }}
      buttonCancel={{ show: true, onClick: () => handleClose(false) }}
      backdropClose={false}
      iconClose={false}
    >
      {data?.message}
    </Modal>
  );
}
