import { ROUTES } from '@shared/constants/routes';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { ArrowLeft, ArrowRight, Copy, Minus, Search, Square, SwatchBook, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router';

import icon from '~/assets/images/icon.ico';
import Img from '~/components/Img';
import { THEME } from '~/context/ThemeContext';
import { useTheme } from '~/hooks/app/useTheme';

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
        {isMaximized ? <Copy size={18} className="rotate-90" /> : <Square size={18} />}
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

const ThemeControlSelector = () => {
  const { theme, setTheme } = useTheme();

  const themes = Object.values(THEME);

  return (
    <div className="dropdown dropdown-center">
      <div tabIndex={0} role="button" className="btn btn-sm btn-ghost btn-circle">
        <SwatchBook size={20} />
      </div>
      <ul tabIndex={-1} className="dropdown-content bg-base-300 rounded-box z-10 w-36 p-2 shadow-lg space-y-2">
        {themes.map((t) => (
          <li key={t}>
            <label className="flex gap-2 cursor-pointer items-center text-sm capitalize">
              <input
                type="radio"
                name="theme-radios"
                className="radio radio-sm theme-controller checked:radio-success"
                value={t}
                checked={theme === t}
                onChange={() => setTheme(t)}
              />
              {t}
            </label>
          </li>
        ))}
      </ul>
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
        <Link to={ROUTES.home.path} className="flex items-center h-full">
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

      <div className="w-[35%] absolute left-1/2 -translate-x-1/2">
        <label className="input input-sm w-full rounded-2xl flex items-center">
          <Search size={20} className="text-base-content/60" />
          <input type="text" className="grow" placeholder="Enter the keyword..." />
        </label>
      </div>

      <div className="flex items-center justify-end space-x-4 h-full">
        <ThemeControlSelector />

        <WindowControlButton />
      </div>
    </div>
  );
}
