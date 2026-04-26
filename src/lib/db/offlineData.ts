import { db } from './db'

const KEYS = ['vocab', 'grammar'] as const
export type OfflineKey = typeof KEYS[number]

const URLS: Record<OfflineKey, string> = {
  vocab:   `${import.meta.env.BASE_URL}data/vocabulary.json`,
  grammar: `${import.meta.env.BASE_URL}data/grammar.json`,
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
    if (!res.ok) throw new Error(`下載失敗：${key} (${res.status})`)
    const data = await res.json()
    await db.offlineData.put({ key, data, savedAt: Date.now() })
    onProgress?.(i + 1, total)
  }
}

export async function getOfflineVocab(): Promise<unknown[] | null> {
  const record = await db.offlineData.get('vocab')
  return record?.data ?? null
}

export async function getOfflineGrammar(): Promise<unknown[] | null> {
  const record = await db.offlineData.get('grammar')
  return record?.data ?? null
}
