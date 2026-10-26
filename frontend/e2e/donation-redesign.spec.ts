import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { DONATION } from '../../backend/src/shared/donation'

test('shared donation design stays blocked, honest about amounts, and usable across screen sizes', async ({ browser }) => {
  test.setTimeout(180_000)
  for (const viewport of [{ width: 1280, height: 800 }, { width: 390, height: 844 }, { width: 844, height: 390 }, { width: 320, height: 640 }]) {
    const context = await browser.newContext({ viewport, hasTouch: viewport.width < 900, isMobile: viewport.width < 900, deviceScaleFactor: 1 })
    try {
      const page = await context.newPage()
      await page.goto('/')
      await page.getByRole('button', { name: /Contribute/i }).first().click()
      const dialog = page.getByRole('dialog', { name: 'Contribute to the festival' })
      await expect(dialog.getByRole('heading', { name: /Support Banaras.*Diwali Mela/i })).toBeVisible()
      await expect(dialog.getByTestId('donation-privacy')).toContainText('Personal payment details are not printed here')
      await expect(dialog).not.toContainText('shreeramdiwalimela@ptyes')
      await expect(dialog).not.toContainText('Khushdeep Anand')
      await expect(dialog.getByRole('button', { name: 'Copy UPI ID' })).toBeDisabled()
      await expect(dialog.locator('img, a[href^="upi:"]')).toHaveCount(0)
      const amounts = dialog.getByRole('group', { name: 'Contribution amount' })
      await expect(amounts.getByRole('button')).toHaveCount(3)
      await amounts.getByRole('button', { name: '₹101', exact: true }).click()
      await expect(amounts.getByRole('button', { name: '₹101', exact: true })).toHaveAttribute('aria-pressed', 'true')
      await expect(dialog.getByText(/₹101 is a suggestion only/)).toBeVisible()
      await expect(dialog.getByRole('button', { name: /Submit reference for manual verification/ })).toBeDisabled()
      await expect(dialog.getByLabel('Reference amount')).toHaveValue('')
      const noOverflow = await dialog.evaluate(element => element.scrollWidth <= element.clientWidth + 1)
      expect(noOverflow, `${viewport.width}x${viewport.height} horizontal overflow`).toBe(true)
      await dialog.evaluate(element => { element.scrollTop = 0 })
      await page.screenshot({ path: `test-results/donation-ui/header-${viewport.width}x${viewport.height}.png` })
      await dialog.getByTestId('qr-unavailable').scrollIntoViewIfNeeded()
      await page.screenshot({ path: `test-results/donation-ui/card-${viewport.width}x${viewport.height}.png` })
      await dialog.getByRole('button', { name: 'Back to Mela' }).click()
      await expect(dialog).toHaveCount(0)
      await page.getByRole('button', { name: /Enter Silently/i }).click()
      await expect(page.getByTestId('multiplayer')).toBeVisible()
    } finally { await context.close() }
  }
})

test('owner-approved Paytm QR displays, copies and builds amount-prefilled UPI links without claiming settlement', async ({ browser }) => {
  for (const viewport of [{ width: 1280, height: 800 }, { width: 390, height: 844 }, { width: 844, height: 390 }, { width: 320, height: 640 }]) {
    const context = await browser.newContext({ viewport, hasTouch: viewport.width < 900, isMobile: viewport.width < 900, deviceScaleFactor: 1, permissions: ['clipboard-read', 'clipboard-write'] })
    try {
      const page = await context.newPage()
      await page.route('**/api/public-config', route => route.fulfill({ json: { data: { mode: 'supabase', demo: false, accepting: false, donationReferenceAvailable: true, donation: DONATION, applicationsOpen: true, recipient: { name: 'Legacy recipient', upiId: 'legacy@upi', qrUrl: '/wrong-qr', paymentUrl: '', enabled: false }, fees: { threeDays: 900, sevenDays: 1800, customPerDay: 350 } } } }))
      await page.route('**/api/payment-qr', route => route.fulfill({ status: 200, contentType: 'image/png', body: readFileSync('../backend/assets/donation-paytm-qr.png') }))
      await page.goto('/'); await page.getByRole('button', { name: /Contribute/i }).first().click()
      const dialog = page.getByRole('dialog', { name: 'Contribute to the festival' })
      const image = dialog.getByRole('img', { name: /Owner-authorised Paytm donation QR/ })
      await expect(image).toBeVisible()
      await expect(dialog.getByTestId('donation-privacy')).toContainText(DONATION.recipient.upiId)
      await expect(dialog).not.toContainText('legacy@upi')
      await dialog.getByRole('button', { name: 'Copy UPI ID', exact: true }).click()
      await expect(dialog.getByText('UPI ID copied.', { exact: true })).toBeVisible()
      expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(DONATION.recipient.upiId)
      const firstLink = new URL((await dialog.getByRole('link', { name: 'Open UPI app for ₹21', exact: true }).getAttribute('href'))!)
      expect(firstLink.searchParams.get('pa')).toBe(DONATION.recipient.upiId)
      expect(firstLink.searchParams.get('am')).toBe('21.00'); expect(firstLink.searchParams.get('cu')).toBe('INR')
      // Never click a real payment deep link in automated verification.
      await image.screenshot({ path: `test-results/donation-paytm/qr-${viewport.width}x${viewport.height}.png` })
      await page.screenshot({ path: `test-results/donation-paytm/card-${viewport.width}x${viewport.height}.png` })
      await dialog.evaluate(element => { element.scrollTop = 0 })
      await page.screenshot({ path: `test-results/donation-paytm/panel-${viewport.width}x${viewport.height}.png` })
      await dialog.getByRole('button', { name: '₹101', exact: true }).click()
      await expect(dialog.getByRole('link', { name: 'Open UPI app for ₹101', exact: true })).toHaveAttribute('href', /am=101\.00/)
      await dialog.getByText('Reference recording · manual review only', { exact: true }).click()
      await expect(dialog.getByRole('button', { name: /Submit reference for manual verification/ })).toBeDisabled()
      await dialog.getByLabel('Reference amount').selectOption('31')
      await dialog.getByPlaceholder('From your UPI app').fill(`PAYTM${viewport.width}${Date.now()}`)
      await dialog.getByRole('button', { name: /Submit reference for manual verification/ }).click()
      await expect(dialog.locator('.result-reference')).toContainText('pending_verification')
      await expect(dialog.locator('.result-reference')).toContainText('TEMPORARY DEMO')
      await expect(dialog).toContainText('never confirms payment')
      expect(await dialog.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true)
    } finally { await context.close() }
  }
})

test('a mismatched QR response cannot expose payment controls even with matching public flags', async ({ page }) => {
  await page.route('**/api/public-config', route => route.fulfill({ json: { data: { mode: 'unavailable', demo: false, accepting: false, donationReferenceAvailable: false, donation: DONATION, applicationsOpen: false, recipient: { name: '', upiId: '', qrUrl: '', paymentUrl: '', enabled: false }, fees: { threeDays: 900, sevenDays: 1800, customPerDay: 350 } } } }))
  await page.route('**/api/payment-qr', route => route.fulfill({ status: 200, contentType: 'image/png', body: Buffer.from('not-the-approved-qr') }))
  await page.goto('/'); await page.getByRole('button', { name: /Contribute/i }).first().click()
  const dialog = page.getByRole('dialog', { name: 'Contribute to the festival' })
  await expect(dialog).toContainText('Approved QR could not be verified or loaded')
  await expect(dialog.getByRole('button', { name: 'Copy UPI ID', exact: true })).toBeDisabled()
  await expect(dialog.locator('img, a[href^="upi:"]')).toHaveCount(0)
})

test('an enabled legacy public configuration cannot re-expose a QR or activate the intended payee', async ({ page }) => {
  await page.route('**/api/public-config', route => route.fulfill({ json: { data: { mode: 'supabase', demo: false, accepting: true, applicationsOpen: true, recipient: { name: 'Legacy recipient', upiId: 'legacy@upi', qrUrl: '/api/payment-qr', paymentUrl: 'https://example.test/pay', enabled: true }, fees: { threeDays: 900, sevenDays: 1800, customPerDay: 350 } } } }))
  await page.goto('/')
  await page.getByRole('button', { name: /Contribute/i }).first().click()
  const dialog = page.getByRole('dialog', { name: 'Contribute to the festival' })
  await expect(dialog.getByTestId('qr-unavailable')).toBeVisible()
  await expect(dialog.locator('img, a[href^="upi:"]')).toHaveCount(0)
  await expect(dialog.getByRole('button', { name: 'Copy UPI ID' })).toBeDisabled()
  await expect(dialog).not.toContainText('legacy@upi')
  await dialog.getByText('Reference recording · manual review only').click()
  await expect(dialog.getByRole('button', { name: /Submit reference for manual verification/ })).toBeDisabled()
  await page.screenshot({ path: 'test-results/donation-ui/blocked-live-configuration.png' })
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
})
