import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockOfflineData = vi.hoisted(() => ({
  bulkGet: vi.fn(),
  get: vi.fn(),
  put: vi.fn(),
}))

vi.mock('./db', () => ({
  db: { offlineData: mockOfflineData },
}))

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

import { getOfflineStatus, downloadOfflineData, getOfflineVocab, getOfflineGrammar } from './offlineData'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getOfflineStatus', () => {
  it('returns hasData=false when no records exist', async () => {
    mockOfflineData.bulkGet.mockResolvedValue([undefined, undefined])
    const status = await getOfflineStatus()
    expect(status.hasData).toBe(false)
    expect(status.savedAt).toBeNull()
  })

  it('returns hasData=true with earliest savedAt when records exist', async () => {
    mockOfflineData.bulkGet.mockResolvedValue([
      { key: 'vocab', data: [], savedAt: 2000 },
      { key: 'grammar', data: [], savedAt: 1000 },
    ])
    const status = await getOfflineStatus()
    expect(status.hasData).toBe(true)
    expect(status.savedAt).toBe(1000)
  })

  it('returns hasData=true when only one record exists', async () => {
    mockOfflineData.bulkGet.mockResolvedValue([
      { key: 'vocab', data: [], savedAt: 5000 },
      undefined,
    ])
    const status = await getOfflineStatus()
    expect(status.hasData).toBe(true)
    expect(status.savedAt).toBe(5000)
  })
})

describe('downloadOfflineData', () => {
  it('fetches both vocab and grammar, then puts them in db', async () => {
    const vocabData = [{ id: 'vocab-N5-001' }]
    const grammarData = [{ id: 'grammar-N5-001' }]

    const makeRes = (data: unknown) => ({
      ok: true,
      headers: { get: () => null },
      json: async () => data,
    })
    mockFetch
      .mockResolvedValueOnce(makeRes(vocabData))
      .mockResolvedValueOnce(makeRes(grammarData))
    mockOfflineData.put.mockResolvedValue(undefined)

    await downloadOfflineData()

    expect(mockFetch).toHaveBeenCalledTimes(2)
    expect(mockOfflineData.put).toHaveBeenCalledTimes(2)
    expect(mockOfflineData.put).toHaveBeenCalledWith(
      expect.objectContaining({ key: 'vocab', data: vocabData }),
    )
    expect(mockOfflineData.put).toHaveBeenCalledWith(
      expect.objectContaining({ key: 'grammar', data: grammarData }),
    )
  })

  it('reports progress after each fetch', async () => {
    const emptyRes = { ok: true, headers: { get: () => null }, json: async () => [] }
    mockFetch
      .mockResolvedValueOnce(emptyRes)
      .mockResolvedValueOnce(emptyRes)
    mockOfflineData.put.mockResolvedValue(undefined)

    const progress: Array<[number, number]> = []
    await downloadOfflineData((done, total) => progress.push([done, total]))

    expect(progress).toEqual([[1, 2], [2, 2]])
  })

  it('throws when fetch fails', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 404, headers: { get: () => null } })

    await expect(downloadOfflineData()).rejects.toThrow('下載失敗')
  })
})

describe('getOfflineVocab', () => {
  it('returns data array when record exists', async () => {
    const data = [{ id: 'vocab-N5-001' }]
    mockOfflineData.get.mockResolvedValue({ key: 'vocab', data, savedAt: 1000 })
    const result = await getOfflineVocab()
    expect(result).toEqual(data)
  })

  it('returns null when no record exists', async () => {
    mockOfflineData.get.mockResolvedValue(undefined)
    const result = await getOfflineVocab()
    expect(result).toBeNull()
  })
})

describe('getOfflineGrammar', () => {
  it('returns data array when record exists', async () => {
    const data = [{ id: 'grammar-N5-001' }]
    mockOfflineData.get.mockResolvedValue({ key: 'grammar', data, savedAt: 1000 })
    const result = await getOfflineGrammar()
    expect(result).toEqual(data)
  })

  it('returns null when no record exists', async () => {
    mockOfflineData.get.mockResolvedValue(undefined)
    const result = await getOfflineGrammar()
    expect(result).toBeNull()
  })
})
