import Dexie, { type EntityTable } from 'dexie'
import type { SrsCard } from '@/lib/srs/types'

export interface OfflineDataRecord {
  key: string      // 'vocab' | 'grammar'
  data: unknown[]
  savedAt: number  // timestamp ms
  etag?: string    // HTTP ETag for change detection
}

class PtjpDb extends Dexie {
  srsCards!: EntityTable<SrsCard, 'cardId'>
  offlineData!: EntityTable<OfflineDataRecord, 'key'>

  constructor() {
    super('ptjp')
    this.version(1).stores({
      // cardId is the primary key; dueAt is indexed for efficient due-card queries
      srsCards: 'cardId, dueAt',
    })
    this.version(2).stores({
      srsCards: 'cardId, dueAt',
      offlineData: 'key',
    })
  }
}

export const db = new PtjpDb()

export async function getOrCreateCard(cardId: string): Promise<SrsCard> {
  const existing = await db.srsCards.get(cardId)
  if (existing) return existing
  const { createCard } = await import('@/lib/srs/sm2')
  const card = createCard(cardId)
  await db.srsCards.put(card)
  return card
}

export async function saveCard(card: SrsCard): Promise<void> {
  await db.srsCards.put(card)
}

export async function getDueCards(now = Date.now()): Promise<SrsCard[]> {
  return db.srsCards.where('dueAt').belowOrEqual(now).toArray()
}

export async function markAsSeen(cardId: string): Promise<void> {
  const existing = await db.srsCards.get(cardId)
  if (existing) return
  const { createCard } = await import('@/lib/srs/sm2')
  await db.srsCards.put(createCard(cardId))
}

export async function getSeenIds(cardIds: string[]): Promise<Set<string>> {
  const found = await db.srsCards.where('cardId').anyOf(cardIds).primaryKeys()
  return new Set(found as string[])
}

export async function getSeenCards(cardIds: string[]): Promise<SrsCard[]> {
  return db.srsCards.where('cardId').anyOf(cardIds).toArray()
}
