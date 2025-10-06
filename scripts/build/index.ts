import { execSync } from 'child_process';
import { rename } from 'fs/promises';

(async () => {
  // Build Client
  execSync('yarn build:client', { stdio: 'inherit' });
  await rename('dist/index.html', 'dist/entry.bin');

  // Build Server
  execSync('yarn build:server', { stdio: 'inherit' });
})();
