import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetOfflineVocab = vi.hoisted(() => vi.fn())
const mockCheckAndRefresh = vi.hoisted(() => vi.fn().mockResolvedValue(undefined))

vi.mock('@/lib/db/offlineData', () => ({
  getOfflineVocab: mockGetOfflineVocab,
  checkAndRefreshOfflineData: mockCheckAndRefresh,
}))

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

// Reset module cache between tests so `cache` variable is cleared
beforeEach(() => {
  vi.clearAllMocks()
  vi.resetModules()
})

describe('loadVocabulary', () => {
  it('returns offline data from IndexedDB when available', async () => {
    const offlineData = [{ id: 'vocab-N5-001', type: 'vocabulary' }]
    mockGetOfflineVocab.mockResolvedValue(offlineData)

    const { loadVocabulary } = await import('./data')
    const result = await loadVocabulary()

    expect(result).toEqual(offlineData)
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('falls back to fetch when IndexedDB has no data', async () => {
    const fetchedData = [{ id: 'vocab-N5-001', type: 'vocabulary' }]
    mockGetOfflineVocab.mockResolvedValue(null)
    mockFetch.mockResolvedValue({ ok: true, json: async () => fetchedData })

    const { loadVocabulary } = await import('./data')
    const result = await loadVocabulary()

    expect(result).toEqual(fetchedData)
    expect(mockFetch).toHaveBeenCalledOnce()
  })

  it('throws when fetch fails and no offline data', async () => {
    mockGetOfflineVocab.mockResolvedValue(null)
    mockFetch.mockResolvedValue({ ok: false, status: 500 })

    const { loadVocabulary } = await import('./data')
    await expect(loadVocabulary()).rejects.toThrow('Failed to load vocabulary data')
  })
})

describe('filterByLevel', () => {
  it('returns only cards matching the given level', async () => {
    mockGetOfflineVocab.mockResolvedValue(null)
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => [
        { id: 'vocab-N5-001', level: 'N5' },
        { id: 'vocab-N4-001', level: 'N4' },
        { id: 'vocab-N5-002', level: 'N5' },
      ],
    })

    const { loadVocabulary, filterByLevel } = await import('./data')
    const all = await loadVocabulary()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const n5 = filterByLevel(all as any, 'N5')

    expect(n5).toHaveLength(2)
    expect(n5.every((c) => c.level === 'N5')).toBe(true)
  })
})
