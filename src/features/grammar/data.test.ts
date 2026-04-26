import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetOfflineGrammar = vi.hoisted(() => vi.fn())

vi.mock('@/lib/db/offlineData', () => ({
  getOfflineGrammar: mockGetOfflineGrammar,
}))

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

beforeEach(() => {
  vi.clearAllMocks()
  vi.resetModules()
})

describe('loadGrammar', () => {
  it('returns offline data from IndexedDB when available', async () => {
    const offlineData = [{ id: 'grammar-N5-001', type: 'grammar' }]
    mockGetOfflineGrammar.mockResolvedValue(offlineData)

    const { loadGrammar } = await import('./data')
    const result = await loadGrammar()

    expect(result).toEqual(offlineData)
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('falls back to fetch when IndexedDB has no data', async () => {
    const fetchedData = [{ id: 'grammar-N5-001', type: 'grammar' }]
    mockGetOfflineGrammar.mockResolvedValue(null)
    mockFetch.mockResolvedValue({ ok: true, json: async () => fetchedData })

    const { loadGrammar } = await import('./data')
    const result = await loadGrammar()

    expect(result).toEqual(fetchedData)
    expect(mockFetch).toHaveBeenCalledOnce()
  })

  it('throws when fetch fails and no offline data', async () => {
    mockGetOfflineGrammar.mockResolvedValue(null)
    mockFetch.mockResolvedValue({ ok: false, status: 500 })

    const { loadGrammar } = await import('./data')
    await expect(loadGrammar()).rejects.toThrow('Failed to load grammar data')
  })
})

describe('filterByLevel', () => {
  it('returns only cards matching the given level', async () => {
    mockGetOfflineGrammar.mockResolvedValue(null)
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => [
        { id: 'grammar-N5-001', level: 'N5' },
        { id: 'grammar-N4-001', level: 'N4' },
        { id: 'grammar-N5-002', level: 'N5' },
      ],
    })

    const { loadGrammar, filterByLevel } = await import('./data')
    const all = await loadGrammar()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const n5 = filterByLevel(all as any, 'N5')

    expect(n5).toHaveLength(2)
    expect(n5.every((c) => c.level === 'N5')).toBe(true)
  })
})
