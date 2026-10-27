import { defineConfig } from '@playwright/test'
import base from './playwright.config'
export default defineConfig({
  ...base,
  testDir: './e2e-staging',
  timeout: 90_000,
  use: { ...base.use, baseURL: 'https://127.0.0.1:5176', ignoreHTTPSErrors: true },
  webServer: [
    { command: 'node dist/server.js', cwd: '../backend', env: {
      PORT: '3102', NODE_ENV: 'production', DEMO_MODE: 'true', STAGING_DEMO: 'true', SERVE_FRONTEND: 'true',
      SUPABASE_URL: '', SUPABASE_SECRET_KEY: '', SUPABASE_SERVICE_ROLE_KEY: '',
      REALTIME_ORIGINS: 'https://127.0.0.1:5176', TRUST_PROXY_HOPS: '0',
      ADMIN_API_TOKEN: 'local-staging-test-only-token-longer-than-32-characters',
    }, url: 'http://127.0.0.1:3102/api/health', reuseExistingServer: false },
    { command: 'node e2e-staging/tls-proxy.mjs', url: 'https://127.0.0.1:5176/api/health', ignoreHTTPSErrors: true, reuseExistingServer: false },
  ],
})
