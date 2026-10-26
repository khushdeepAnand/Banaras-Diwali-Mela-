import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { App } from './App'

describe('festival entry screen', () => {
  it('provides entry and does not present payments as live', () => {
    const html = renderToStaticMarkup(<MemoryRouter><App /></MemoryRouter>)
    expect(html).toContain('Banaras Diwali Mela')
    expect(html).toContain('Contributions and stall applications require a configured backend.')
    expect(html).toContain('Payment references await manual review')
    expect(html).toContain('Enter Silently')
    expect(html).toContain('Enter with Sound')
    expect(html).toContain('no separate game installation needed')
  })
})
