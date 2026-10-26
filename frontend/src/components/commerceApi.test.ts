import { afterEach, expect, it, vi } from 'vitest'
import { api, assetUrl, rentalFee, upiLink } from './commerceApi'
afterEach(() => vi.restoreAllMocks())
it('shows server-defined fees and does not invent recipient data', () => {
  expect(rentalFee(3, { threeDays: 900, sevenDays: 1800, customPerDay: 350 })).toBe(900)
  expect(upiLink({ name: '', upiId: '', paymentUrl: '', qrUrl: '', enabled: false }, 21)).toBeNull()
  expect(upiLink({ name: 'Test', upiId: 'test@upi', paymentUrl: '', qrUrl: '', enabled: true }, 31)).toContain('am=31.00')
})
it('handles database errors, malformed success, network failures and request timeout signals truthfully', async () => {
  const fetcher = vi.spyOn(globalThis, 'fetch')
  fetcher.mockResolvedValueOnce(new Response(JSON.stringify({ error: { message: 'Service temporarily unavailable; please retry later' } }), { status: 503 }))
  await expect(api('/applications')).rejects.toThrow('Service temporarily unavailable')
  for (const body of ['{}', 'null', '<html>fallback</html>']) {
    fetcher.mockResolvedValueOnce(new Response(body))
    await expect(api('/applications')).rejects.toThrow('Invalid server response')
  }
  fetcher.mockRejectedValueOnce(new Error('offline'))
  await expect(api('/applications')).rejects.toThrow('Network unavailable')
  fetcher.mockResolvedValueOnce(new Response(JSON.stringify({ data: { status: 'pending_verification' } })))
  expect(await api('/contributions', { method: 'POST' }, 'test-only')).toEqual({ status: 'pending_verification' })
  expect(fetcher.mock.lastCall?.[1]?.signal).toBeInstanceOf(AbortSignal)
  expect(fetcher.mock.lastCall?.[1]?.headers).toMatchObject({ Authorization: 'Bearer test-only' })
  expect(assetUrl('/api/payment-qr')).toBe('/api/payment-qr')
  expect(assetUrl('https://example.test/qr.jpg')).toBe('https://example.test/qr.jpg')
})
