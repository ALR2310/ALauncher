import mitt from 'mitt';

type ConfirmEvents = {
  open: {
    message: React.ReactNode;
    title?: React.ReactNode;
    resolve: (result: boolean) => void;
  };
};

export const confirmBus = mitt<ConfirmEvents>();
export type { ConfirmEvents };
