import express, { type Express } from 'express'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

// Serve only the built public frontend, never the repository/backend directory.
export function mountFrontend(app: Express, directory: URL, origins: readonly string[], staging: boolean) {
  const root = fileURLToPath(directory), index = join(root, 'index.html')
  if (!existsSync(index)) throw new Error('Build the frontend before enabling static serving')
  const sockets = origins.map(origin => origin.replace(/^http/, 'ws')).join(' ')
  app.use((req, res, next) => {
    if (/^\/api(?:\/|$)/i.test(req.path)) { next(); return }
    res.set({
      'Content-Security-Policy': `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; connect-src 'self' ${sockets}; object-src 'none'; base-uri 'self'; frame-ancestors 'none'`,
      'X-Frame-Options': 'DENY',
    })
    if (staging) res.set('X-Robots-Tag', 'noindex, nofollow')
    if (/(?:^|\/)\.|\.map$/i.test(req.path)) { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Resource not found' } }); return }
    next()
  })
  for (const folder of ['assets', 'audio', 'gallery']) app.use(`/${folder}`, express.static(join(root, folder), {
    dotfiles: 'deny', index: false, fallthrough: true,
    setHeaders: res => res.setHeader('Cache-Control', folder === 'assets' ? 'public, max-age=31536000, immutable' : 'public, max-age=0, must-revalidate'),
  }))
  app.get('/favicon.svg', (_req, res, next) => res.sendFile(join(root, 'favicon.svg'), error => { if (error) next() }))
  app.use((req, res, next) => {
    if (!['GET', 'HEAD'].includes(req.method) || !req.accepts('html') || /^\/(?:api|assets|audio|gallery)(?:\/|$)/i.test(req.path) || req.path !== '/index.html' && req.path.includes('.')) { next(); return }
    res.set('Cache-Control', 'no-cache')
    res.sendFile(index)
  })
}
