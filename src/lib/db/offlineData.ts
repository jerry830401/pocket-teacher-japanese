import { db } from './db'

const KEYS = ['vocab', 'grammar'] as const
export type OfflineKey = typeof KEYS[number]

const URLS: Record<OfflineKey, string> = {
  vocab:   `${import.meta.env.BASE_URL}data/vocabulary.json`,
  grammar: `${import.meta.env.BASE_URL}data/grammar.json`,
}

// 下載失敗的訊息會直接印在設定頁上（OfflineDataButton），所以這裡的字串是
// 使用者看得到的文案，不能把內部的 key 漏出去
const LABELS: Record<OfflineKey, string> = {
  vocab:   '單字',
  grammar: '文法',
}

export interface OfflineStatus {
  hasData: boolean
  savedAt: number | null  // ms timestamp; null = no data
}

export async function getOfflineStatus(): Promise<OfflineStatus> {
  const records = await db.offlineData.bulkGet(KEYS as unknown as string[])
  const existing = records.filter(Boolean)
  if (existing.length === 0) return { hasData: false, savedAt: null }
  const savedAt = Math.min(...existing.map((r) => r!.savedAt))
  return { hasData: true, savedAt }
}

export async function downloadOfflineData(
  onProgress?: (done: number, total: number) => void,
): Promise<void> {
  const total = KEYS.length
  for (let i = 0; i < KEYS.length; i++) {
    const key = KEYS[i]
    const res = await fetch(URLS[key])
    if (!res.ok) throw new Error(`下載失敗：${LABELS[key]}（${res.status}）`)
    const data = await res.json()
    const etag = res.headers.get('etag') ?? undefined
    await db.offlineData.put({ key, data, savedAt: Date.now(), etag })
    onProgress?.(i + 1, total)
  }
}

// Check each key via HEAD request; re-download if ETag differs.
// Returns true if any key was updated. Callers may fire-and-forget.
export async function checkAndRefreshOfflineData(): Promise<boolean> {
  let updated = false
  for (const key of KEYS) {
    try {
      const record = await db.offlineData.get(key)
      if (!record) continue  // not downloaded yet; skip

      const head = await fetch(URLS[key], { method: 'HEAD' })
      if (!head.ok) continue

      const remoteEtag = head.headers.get('etag')
      // If server sends no ETag we can't compare — skip to avoid unnecessary downloads
      if (!remoteEtag) continue
      if (remoteEtag === record.etag) continue  // up to date

      // ETag changed: re-download this key
      const res = await fetch(URLS[key])
      if (!res.ok) continue
      const data = await res.json()
      const etag = res.headers.get('etag') ?? undefined
      await db.offlineData.put({ key, data, savedAt: Date.now(), etag })
      updated = true
    } catch {
      // network offline or transient error — silently skip
    }
  }
  return updated
}

export async function getOfflineVocab(): Promise<unknown[] | null> {
  const record = await db.offlineData.get('vocab')
  return record?.data ?? null
}

export async function getOfflineGrammar(): Promise<unknown[] | null> {
  const record = await db.offlineData.get('grammar')
  return record?.data ?? null
}
