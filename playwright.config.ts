import {defineConfig, devices} from '@playwright/test';
import dotenv from 'dotenv';

// Load variables from .env file
dotenv.config({quiet: true});

export default defineConfig({
  testDir: './tests/browser',
  timeout: 10_000,
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
    launchOptions: {
      args: ['--autoplay-policy=no-user-gesture-required'],
    },
  },
  projects: [{name: 'chromium', use: {...devices['Desktop Chrome']}}],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
