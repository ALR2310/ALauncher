import { RefObject } from 'react';

interface ButtonProps {
  label?: string;
  show?: boolean;
  className?: string;
  onClick?: () => void | Promise<void>;
}

export interface ModalProps {
  ref?: RefObject<HTMLDialogElement | null>;
  title?: React.ReactNode | string;
  className?: string;
  modalClassName?: string;
  buttonSubmit?: ButtonProps;
  buttonCancel?: ButtonProps;
  backdropClose?: boolean;
  iconClose?: boolean;
  children?: React.ReactNode;
}

export function Modal({
  ref,
  title,
  className,
  modalClassName,
  buttonSubmit = { show: true },
  buttonCancel = { show: true },
  backdropClose = true,
  iconClose = true,
  children,
}: ModalProps) {
  return (
    <dialog ref={ref} className={`modal outline-none ${modalClassName || ''}`}>
      <div className={`modal-box outline-none ${className}`}>
        {iconClose && (
          <form method="dialog">
            <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
          </form>
        )}

        {title && <div className="text-lg font-bold mb-4">{title}</div>}
        {children}

        {(buttonSubmit?.show || buttonCancel?.show) && (
          <div className="modal-action">
            {buttonCancel?.show && (
              <button
                className={`btn w-24 ${buttonCancel?.className || 'btn-soft'}`}
                onClick={() => {
                  if (buttonCancel.onClick) buttonCancel.onClick();
                  else ref?.current?.close();
                }}
              >
                {buttonCancel?.label || 'Cancel'}
              </button>
            )}

            {buttonSubmit?.show && (
              <button
                className={`btn w-24 ${buttonSubmit?.className || 'btn-success'}`}
                onClick={() => {
                  if (buttonSubmit.onClick) buttonSubmit.onClick();
                  else ref?.current?.close();
                }}
              >
                {buttonSubmit?.label || 'OK'}
              </button>
            )}
          </div>
        )}
      </div>
      {backdropClose && (
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      )}
    </dialog>
  );
}
