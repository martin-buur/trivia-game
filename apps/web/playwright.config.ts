import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'dot',
  globalSetup: './e2e/global-setup.ts',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Add more browsers if needed
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  webServer: [
    {
      command: 'pnpm dev',
      cwd: '../../apps/api',
      port: 3001,
      // IMPORTANT: When reuseExistingServer is true, the E2E_TEST env var may not be passed
      // to an already running server. Use CI=true or pnpm test:e2e:clean to ensure fresh start
      reuseExistingServer: !process.env.CI,
      env: {
        ...process.env,
        E2E_TEST: 'true',
      },
    },
    {
      command: 'pnpm dev',
      cwd: '.',
      port: 3000,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
