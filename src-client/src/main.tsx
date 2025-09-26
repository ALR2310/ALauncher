import { Command } from '@tauri-apps/plugin-shell';
import dayjs from 'dayjs';
import { createRoot } from 'react-dom/client';

import App from './App';
import { toast } from './hooks/app/useToast';

const container = document.getElementById('root');
const root = createRoot(container!);

// Global
(window as any).dayjs = dayjs;
(window as any).toast = toast;

// Load server
if (window.isTauri) {
  Command.sidecar('binaries/server').spawn();
}

// Render GUI
root.render(<App />);
