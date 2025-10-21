import uniqueId from 'lodash/uniqueId';
import { animate } from 'motion';
import React, { createContext, ReactNode, useCallback, useEffect, useRef, useState } from 'react';

import { setToastFunction } from '~/hooks/app/useToast';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
  duration?: number;
  isLoading?: boolean;
}

interface ToastContextType {
  showToast: (toast: Omit<ToastProps, 'id'>, callback?: () => Promise<void>) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const classMap = {
  success: { toast: 'alert-success', icon: 'fa-circle-check' },
  error: { toast: 'alert-error', icon: 'fa-circle-xmark' },
  warning: { toast: 'alert-warning', icon: 'fa-triangle-exclamation' },
  info: { toast: 'alert-info', icon: 'fa-circle-info' },
};

const titleMap = {
  success: 'Successfully',
  error: 'Failed',
  warning: 'Warning',
  info: 'Information',
};

const Toast: React.FC<ToastProps & { onClose: () => void }> = ({ type, message, title, isLoading, onClose }) => {
  const { toast: toastClass, icon: iconClass } = classMap[type];
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      animate(ref.current, { x: ['105%', '-5%', '2%', '0%'], opacity: [0, 1] }, { duration: 0.5 });
    }
  }, []);

  const handleClose = () => {
    if (ref.current) {
      animate(ref.current, { x: ['0%', '-5%', '105%'], opacity: [1, 0] }, { duration: 0.5 }).finished.then(() =>
        onClose(),
      );
    } else {
      onClose();
    }
  };

  return (
    <div ref={ref} className={`alert ${toastClass} alert-soft p-3 flex gap-2 items-start max-w-[70vw]`}>
      <div className="flex-none">
        {isLoading ? (
          <span className="loading loading-spinner loading-sm"></span>
        ) : (
          <i className={`text-xl fa-sharp fa-regular ${iconClass}`}></i>
        )}
      </div>
      <div className="flex-1">
        <strong>{title || titleMap[type]}</strong>
        <p className="text-wrap">{message}</p>
      </div>
      <i className="fa-light fa-xmark cursor-pointer" onClick={handleClose}></i>
    </div>
  );
};

const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const showToast = useCallback((toast: Omit<ToastProps, 'id'>, callback?: () => Promise<void>) => {
    const id = uniqueId();
    setToasts((prev) => [...prev, { ...toast, id, isLoading: !!callback }]);

    if (callback) {
      callback().finally(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      });
    } else {
      // eslint-disable-next-line react-hooks/immutability
      setTimeout(() => removeToast(id), toast.duration || 3000);
    }
  }, []);

  // Toast function global
  useEffect(() => {
    setToastFunction(showToast);
  }, [showToast]);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div id="toast-container" className="toast toast-top z-10">
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export { ToastContext, ToastProvider };
export type { ToastProps };
