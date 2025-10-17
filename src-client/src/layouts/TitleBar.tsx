import { getCurrentWindow } from '@tauri-apps/api/window';
import { ArrowLeft, ArrowRight, Copy, Minus, Search, Square, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router';

import icon from '~/assets/images/icon.ico';
import Img from '~/components/Img';
import { ROUTES } from '~/constants/routes';

const WindowControlButton = () => {
  const isTauri = window.isTauri;
  const appWindow = isTauri ? getCurrentWindow() : null;

  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    if (!appWindow) return;

    let cleanup: (() => void) | undefined;

    (async () => {
      setIsMaximized(await appWindow.isMaximized());
      const unlisten = await appWindow.onResized(async () => {
        setIsMaximized(await appWindow.isMaximized());
      });
      cleanup = unlisten;
    })();

    return () => {
      if (cleanup) cleanup();
    };
  }, [appWindow]);

  return (
    <div className="flex items-center gap-x-2 me-1 h-full">
      {/* Minimize */}
      <button
        onClick={() => {
          if (!appWindow) return;
          appWindow.minimize();
        }}
        className="btn btn-circle btn-ghost flex items-center justify-center hover:bg-base-content/10"
        tabIndex={-1}
      >
        <Minus size={19} />
      </button>

      {/* Maximize / Restore */}
      <button
        onClick={async () => {
          if (!appWindow) return;
          if (isMaximized) appWindow.unmaximize();
          else appWindow.maximize();
        }}
        className="btn btn-circle btn-ghost flex items-center justify-center hover:bg-base-content/10"
        tabIndex={-1}
      >
        {isMaximized ? <Copy size={18} className="rotate-[90deg]" /> : <Square size={18} />}
      </button>

      {/* Close */}
      <button
        onClick={() => {
          if (!appWindow) return;
          appWindow.close();
        }}
        className="btn btn-circle btn-ghost flex items-center justify-center hover:bg-error"
        tabIndex={-1}
      >
        <X size={19} />
      </button>
    </div>
  );
};

export default function TitleBar() {
  return (
    <div
      id="title-bar"
      data-tauri-drag-region
      className="relative flex items-center justify-between h-12 bg-base-200 select-none cursor-grab active:cursor-grabbing"
    >
      <div className="flex items-center h-full pl-1 space-x-4">
        <Link to={ROUTES.HOME} className="flex items-center h-full">
          <Img src={icon} alt="title icon" className="h-full p-3" data-tauri-drag-region />
          <p className="font-semibold text-xl" data-tauri-drag-region>
            <span className="text-success">A</span>L<span className="text-success">a</span>uncher
          </p>
        </Link>

        <div className="flex items-center gap-2">
          <button className="btn btn-sm btn-circle btn-soft" onClick={() => window.history.back()}>
            <ArrowLeft size={20} />
          </button>
          <button className="btn btn-sm btn-circle btn-soft" onClick={() => window.history.forward()}>
            <ArrowRight size={20} />
          </button>
        </div>
      </div>

      <div className="absolute left-1/2 -translate-x-1/2">
        <label className="input input-sm w-72 rounded-2xl flex items-center">
          <Search size={20} className="text-base-content/60" />
          <input type="text" className="grow" placeholder="Enter the keyword..." />
        </label>
      </div>

      <div className="flex items-center justify-end space-x-4 h-full">
        {/* Window Control Buttons */}
        <WindowControlButton />
      </div>
    </div>
  );
}
