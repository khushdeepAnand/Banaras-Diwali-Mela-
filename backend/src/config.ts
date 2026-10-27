import { z } from 'zod'

const environment = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DEMO_MODE: z.enum(['true', 'false']).default('false'),
  STAGING_DEMO: z.enum(['true', 'false']).default('false'),
  SERVE_FRONTEND: z.enum(['true', 'false']).default('false'),
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(5).default(0),
  REALTIME_ORIGINS: z.string().default('http://127.0.0.1:5173,http://localhost:5173,http://127.0.0.1:5174,http://localhost:5174'),
  GROUP_DIYA_THRESHOLD: z.coerce.number().int().min(2).max(4).default(3),
  GROUP_DIYA_WINDOW_MS: z.coerce.number().int().min(1000).max(120000).default(30000),
  SUPABASE_URL: z.union([z.literal(''), z.url()]).default(''),
  SUPABASE_SERVICE_ROLE_KEY: z.string().default(''),
  SUPABASE_SECRET_KEY: z.string().default(''),
  ADMIN_API_TOKEN: z.string().default(''),
}).superRefine((env, context) => {
  const invalid = (path: string, message: string) => context.addIssue({ code: 'custom', path: [path], message })
  const key = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY
  if (env.SUPABASE_SECRET_KEY && env.SUPABASE_SERVICE_ROLE_KEY && env.SUPABASE_SECRET_KEY !== env.SUPABASE_SERVICE_ROLE_KEY) invalid('SUPABASE_SECRET_KEY', 'Configure only one backend key; conflicting aliases are forbidden')
  if (env.SUPABASE_SECRET_KEY && !env.SUPABASE_SECRET_KEY.startsWith('sb_secret_')) invalid('SUPABASE_SECRET_KEY', 'Use a server-only secret key')
  if (key.startsWith('sb_publishable_')) invalid('SUPABASE_SERVICE_ROLE_KEY', 'Publishable keys cannot authorise the backend')
  if (key.startsWith('eyJ')) {
    try {
      if (JSON.parse(Buffer.from(key.split('.')[1] ?? '', 'base64url').toString()).role !== 'service_role') invalid('SUPABASE_SERVICE_ROLE_KEY', 'Use a service_role key, not an anon or user token')
    } catch { invalid('SUPABASE_SERVICE_ROLE_KEY', 'Invalid legacy key format') }
  }
  if (Boolean(env.SUPABASE_URL) !== Boolean(key)) invalid('SUPABASE_URL', 'Configure the database URL and a backend key together')
  if (env.SUPABASE_URL) {
    const url = new URL(env.SUPABASE_URL)
    if (url.username || url.password || url.search || url.hash || url.pathname !== '/' || !['http:', 'https:'].includes(url.protocol)) invalid('SUPABASE_URL', 'Use a database origin without credentials, path or query parameters')
    if (url.protocol !== 'https:' && (env.NODE_ENV === 'production' || !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname))) invalid('SUPABASE_URL', 'HTTPS required outside local development')
  }
  if (env.ADMIN_API_TOKEN && env.ADMIN_API_TOKEN.length < 32) invalid('ADMIN_API_TOKEN', 'Use a random token of at least 32 characters')
  if (env.STAGING_DEMO === 'true') {
    if (env.NODE_ENV !== 'production' || env.DEMO_MODE !== 'true') invalid('STAGING_DEMO', 'Staging demo requires production runtime and explicit demo mode')
    if (env.SUPABASE_URL || key) invalid('STAGING_DEMO', 'Staging demo forbids database credentials')
  }
  if (env.NODE_ENV === 'production') {
    if (env.STAGING_DEMO !== 'true') {
      if (env.DEMO_MODE === 'true') invalid('DEMO_MODE', 'Demo storage is forbidden in production')
      if (!env.SUPABASE_URL || !key) invalid('SUPABASE_URL', 'Production requires persistent storage')
    }
    if (!env.ADMIN_API_TOKEN) invalid('ADMIN_API_TOKEN', 'Production requires organiser authentication')
  }
})

export function loadConfig(env: NodeJS.ProcessEnv = process.env) {
  return environment.parse(env)
}
