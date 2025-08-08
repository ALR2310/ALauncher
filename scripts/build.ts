import { execSync } from 'child_process';
import { config } from 'dotenv';

config();

const env = {
  ...process.env,
  TAURI_SIGNING_PRIVATE_KEY: process.env.TAURI_SIGNING_PRIVATE_KEY,
  TAURI_SIGNING_PRIVATE_KEY_PASSWORD: process.env.TAURI_SIGNING_PRIVATE_KEY_PASSWORD,
};

execSync('yarn tauri build', {
  stdio: 'inherit',
  env,
});
