import { check } from '@tauri-apps/plugin-updater';

import { confirm } from './useConfirm';

export function useUpdater() {
  const checkForUpdates = async () => {
    const update = await check();

    if (update) {
      await update.download();

      const yes = await confirm({
        backdropClose: true,
        iconClose: true,
        titlePosition: 'center',
        title: 'Update Available',
        content: 'A new version of ALauncher is available. Restart to apply?',
      });

      if (yes) {
        (window as any).serverProcess.kill();
        await update.install();
      }
    }
  };

  return { checkForUpdates };
}
