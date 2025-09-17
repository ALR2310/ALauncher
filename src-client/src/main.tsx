import { Command } from '@tauri-apps/plugin-shell';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import duration from 'dayjs/plugin/duration';
import LocalizedFormat from 'dayjs/plugin/localizedFormat';
import relativeTime from 'dayjs/plugin/relativeTime';
import utc from 'dayjs/plugin/utc';
import { createRoot } from 'react-dom/client';

import App from './App';
import { toast } from './hooks/useToast';

// Initialize dayjs plugin
dayjs.extend(utc);
dayjs.extend(customParseFormat);
dayjs.extend(LocalizedFormat);
dayjs.extend(relativeTime);
dayjs.extend(duration);
dayjs.locale('vi');

const container = document.getElementById('root');
const root = createRoot(container!);

// Global
(window as any).dayjs = dayjs;
(window as any).toast = toast;

(async () => {
  // Load server
  if (window.isTauri) {
    const command = Command.sidecar('binaries/server');
    await command.spawn();
  }

  // Render GUI
  root.render(<App />);
})();
