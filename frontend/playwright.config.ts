import { defineConfig } from '@playwright/test'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const frontendDir = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  testDir: './e2e',
  // Software WebGL contexts compete heavily when scenes render in parallel.
  workers: 1,
  timeout: 60_000,
  // The 3D scene is loaded lazily and SwiftShader startup can exceed 5 seconds.
  expect: { timeout: 20_000 },
  use: {
    baseURL: 'http://127.0.0.1:5174',
    browserName: 'chromium',
    channel: process.platform === 'win32' ? 'msedge' : undefined,
    launchOptions: { args: ['--enable-webgl', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] },
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 2,
  },
  webServer: [
    { command: 'node --import tsx src/server.ts', cwd: resolve(frontendDir, '../backend'), env: { PORT: '3101', DEMO_MODE: 'true', NODE_ENV: 'test', SUPABASE_URL: '', SUPABASE_SECRET_KEY: '', SUPABASE_SERVICE_ROLE_KEY: '', ADMIN_API_TOKEN: 'playwright-local-only-admin-token-1234567890' }, url: 'http://127.0.0.1:3101/api/health', timeout: 120_000, reuseExistingServer: false },
    { command: 'node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5174 --strictPort', cwd: frontendDir, env: { API_PROXY_TARGET: 'http://127.0.0.1:3101' }, url: 'http://127.0.0.1:5174', timeout: 120_000, reuseExistingServer: false },
  ],
})
