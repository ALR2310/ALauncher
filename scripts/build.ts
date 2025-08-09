import { execSync } from 'child_process';
import { config } from 'dotenv';

config();

const env = {
  ...process.env,
  TAURI_SIGNING_PRIVATE_KEY: process.env.TAURI_SIGNING_PRIVATE_KEY,
  TAURI_SIGNING_PRIVATE_KEY_PASSWORD: process.env.TAURI_SIGNING_PRIVATE_KEY_PASSWORD,
};

execSync('yarn build:server', { stdio: 'inherit' });

execSync('yarn tauri build', { stdio: 'inherit', env });
