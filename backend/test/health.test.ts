import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createApp } from '../src/app.js'
import { loadConfig } from '../src/config.js'

describe('backend foundation', () => {
  const app = createApp()

  it('reports health', async () => {
    const response = await request(app).get('/api/health')
    expect(response.status).toBe(200)
    expect(response.body).toEqual({ data: { status: 'ok' } })
  })

  it('rejects unexpected query parameters', async () => {
    const response = await request(app).get('/api/health?verify=true')
    expect(response.status).toBe(400)
    expect(response.body.error.code).toBe('INVALID_REQUEST')
  })

  it('does not leak errors on unknown routes', async () => {
    const response = await request(app).get('/api/missing')
    expect(response.status).toBe(404)
    expect(response.body.error.code).toBe('NOT_FOUND')
  })

  it('rejects invalid configuration', () => {
    expect(() => loadConfig({ PORT: '0' })).toThrow()
  })
})
