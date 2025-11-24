import { defaultWindowIcon } from '@tauri-apps/api/app';
import { Menu } from '@tauri-apps/api/menu';
import { TrayIcon } from '@tauri-apps/api/tray';
import { getCurrentWebview } from '@tauri-apps/api/webview';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { useCallback, useRef } from 'react';

export function useWindow() {
  const isTauri = window.isTauri;
  const trayRef = useRef<TrayIcon | null>(null);

  const show = useCallback(() => {
    if (!isTauri) return;
    getCurrentWebview().show();
    getCurrentWindow().show();
  }, [isTauri]);

  const hide = useCallback(() => {
    if (!isTauri) return;
    getCurrentWebview().hide();
    getCurrentWindow().hide();
  }, [isTauri]);

  const close = useCallback(() => {
    if (!isTauri) return;
    getCurrentWindow().close();
  }, [isTauri]);

  const createTrayIcon = useCallback(async () => {
    if (isTauri && trayRef.current) return trayRef.current;
    if (!isTauri) return null;

    const tray = await TrayIcon.new({
      title: 'ALauncher',
      icon: (await defaultWindowIcon()) || undefined,
      menu: await Menu.new({
        items: [
          {
            id: 'show',
            text: 'Show',
            action: () => show(),
          },
          {
            id: 'hide',
            text: 'Hide',
            action: () => hide(),
          },
          {
            id: 'quit',
            text: 'Quit',
            action: () => close(),
          },
        ],
      }),
      action: (event) => {
        switch (event.type) {
          case 'DoubleClick':
            console.log(event);
            getCurrentWindow()
              .isVisible()
              .then((visible) => {
                if (visible) {
                  hide();
                } else {
                  show();
                }
              });
            break;
        }
      },
    });

    trayRef.current = tray;
    return trayRef.current;
  }, [close, hide, isTauri, show]);

  return { close, show, hide, createTrayIcon };
}
