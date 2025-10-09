import { listen } from '@tauri-apps/api/event';
import dayjs from 'dayjs';
import { createRoot } from 'react-dom/client';

import { appExit } from './api';
import App from './App';
import { toast } from './hooks/app/useToast';

const container = document.getElementById('root');
const root = createRoot(container!);

// Global
(window as any).dayjs = dayjs;
(window as any).toast = toast;

// App Event
if (window.isTauri) {
  await listen('tauri://close-requested', () => appExit());
}

// Render GUI
root.render(<App />);
