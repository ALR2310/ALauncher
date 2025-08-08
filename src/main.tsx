import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import duration from 'dayjs/plugin/duration';
import LocalizedFormat from 'dayjs/plugin/localizedFormat';
import relativeTime from 'dayjs/plugin/relativeTime';
import utc from 'dayjs/plugin/utc';
import React from 'react';
import { createRoot } from 'react-dom/client';

import App from './App';

// Initialize dayjs plugin
dayjs.extend(utc);
dayjs.extend(customParseFormat);
dayjs.extend(LocalizedFormat);
dayjs.extend(relativeTime);
dayjs.extend(duration);
dayjs.locale('vi');

const container = document.getElementById('root');
const root = createRoot(container!);

(async () => {
  // Load server
  // const command = Command.sidecar('binaries/app');
  // await command.execute();

  // Render GUI
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
})();
