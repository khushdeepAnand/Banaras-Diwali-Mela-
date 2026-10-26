import { DEFAULT_SETTINGS, settingsSchema, type Application, type Contribution, type Settings } from './commerce.js'

export interface CommerceStore {
  getSettings(): Promise<Settings>
  saveSettings(settings: Settings): Promise<void>
  addContribution(record: Contribution): Promise<void>
  addApplication(record: Application): Promise<void>
  getApplication(reference: string): Promise<Application | null>
  updateApplication(record: Application, paymentOnly?: boolean): Promise<void>
  listApplications(): Promise<Application[]>
  listContributions(): Promise<Contribution[]>
  updateContribution(record: Contribution): Promise<void>
}

export class DuplicateError extends Error {}
export class StoreUnavailableError extends Error {}

// Explicit opt-in, per-process demo only. Never promise persistence or real collection.
export class DemoStore implements CommerceStore {
  private settings: Settings = structuredClone(DEFAULT_SETTINGS)
  private contributions: Contribution[] = []
  private applications: Application[] = []
  async getSettings() { return structuredClone(this.settings) }
  async saveSettings(value: Settings) { this.settings = structuredClone(value) }
  async addContribution(record: Contribution) {
    if (this.contributions.some(existing => existing.utr.toLowerCase() === record.utr.toLowerCase())) throw new DuplicateError('Duplicate UTR')
    this.contributions.push(record)
  }
  async addApplication(record: Application) {
    if (this.applications.some(existing => existing.requestHash === record.requestHash)) throw new DuplicateError('Duplicate application')
    this.applications.push(record)
  }
  async getApplication(reference: string) { return this.applications.find(item => item.reference === reference) ?? null }
  async updateApplication(record: Application, paymentOnly = false) {
    const existing = this.applications.find(item => item.id === record.id)
    if (paymentOnly && (!existing || existing.paymentStatus === 'verified' || existing.status === 'rejected')) throw new StoreUnavailableError('Application changed; refresh before retrying')
    if (record.utr && this.applications.some(item => item.id !== record.id && item.utr?.toLowerCase() === record.utr!.toLowerCase())) throw new DuplicateError('Duplicate UTR')
    if (!this.applications.some(item => item.id === record.id)) throw new StoreUnavailableError('Missing application')
    this.applications = this.applications.map(item => item.id === record.id ? paymentOnly ? { ...item, utr: record.utr, paymentStatus: record.paymentStatus } : record : item)
  }
  async listApplications() { return [...this.applications] }
  async listContributions() { return [...this.contributions] }
  async updateContribution(record: Contribution) { this.contributions = this.contributions.map(item => item.id === record.id ? record : item) }
}

// Supabase HTTPS Data API; privileged credentials used ONLY by this server.
export class SupabaseStore implements CommerceStore {
  constructor(private url: string, private key: string) {}
  private async query<T>(table: string, method = 'GET', body?: unknown, filter = '', single = false): Promise<T> {
    try {
      const response = await fetch(`${this.url.replace(/\/$/, '')}/rest/v1/${table}${filter}`, {
        method,
        headers: { apikey: this.key, ...(!this.key.startsWith('sb_secret_') ? { Authorization: `Bearer ${this.key}` } : {}), 'Content-Type': 'application/json', Prefer: method === 'POST' ? 'return=minimal' : 'return=representation' },
        ...(body ? { body: JSON.stringify(body) } : {}),
        signal: AbortSignal.timeout(6000),
      })
      if (response.status === 409) throw new DuplicateError('Duplicate submission')
      if (!response.ok) throw new StoreUnavailableError(`Database returned ${response.status}`)
      if (response.status === 204 || method === 'POST') return undefined as T
      const value = await response.json() as unknown
      if (!Array.isArray(value) || method === 'PATCH' && value.length !== 1) throw new StoreUnavailableError('Unexpected database result')
      return (single ? (value as unknown[])[0] ?? null : value) as T
    } catch (error) {
      if (error instanceof DuplicateError || error instanceof StoreUnavailableError) throw error
      throw new StoreUnavailableError('Database unavailable')
    }
  }
  async getSettings(): Promise<Settings> {
    const row = await this.query<{ value: Settings } | null>('mela_settings', 'GET', undefined, '?id=eq.main&select=value', true)
    const result = settingsSchema.safeParse(row?.value)
    if (!result.success) throw new StoreUnavailableError('Database settings missing or invalid')
    return result.data
  }
  async saveSettings(settings: Settings) { await this.query('mela_settings', 'PATCH', { value: settings }, '?id=eq.main') }
  async addContribution(record: Contribution) { await this.query('mela_contributions', 'POST', record) }
  async addApplication(record: Application) { await this.query('mela_applications', 'POST', record) }
  async getApplication(reference: string) { return this.query<Application | null>('mela_applications', 'GET', undefined, `?reference=eq.${encodeURIComponent(reference)}&select=*`, true) }
  async updateApplication(record: Application, paymentOnly = false) {
    await this.query('mela_applications', 'PATCH', paymentOnly ? { utr: record.utr, paymentStatus: 'pending_verification' } : record,
      `?id=eq.${record.id}${paymentOnly ? '&paymentStatus=neq.verified&status=neq.rejected' : ''}`)
  }
  private async list<T>(table: string): Promise<T[]> {
    const result: T[] = []
    // Advance by actual page size: a hosting project's lower row cap must not truncate records.
    let offset = 0
    while (true) {
      const page = await this.query<T[]>(table, 'GET', undefined, `?select=*&order=createdAt.desc,id.desc&limit=500&offset=${offset}`)
      result.push(...page)
      if (page.length === 0) return result
      offset += page.length
    }
  }
  async listApplications() { return this.list<Application>('mela_applications') }
  async listContributions() { return this.list<Contribution>('mela_contributions') }
  async updateContribution(record: Contribution) { await this.query('mela_contributions', 'PATCH', record, `?id=eq.${record.id}`) }
}
