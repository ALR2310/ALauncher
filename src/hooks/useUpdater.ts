import { relaunch } from '@tauri-apps/plugin-process';
import { check } from '@tauri-apps/plugin-updater';

export async function checkForAppUpdates() {
  const update = await check();

  if (update) {
    const yes = confirm('A new version of ALauncher is available. Would you like to update?');
    if (yes) {
      await update.downloadAndInstall();
      await relaunch();
    }
  }
}
