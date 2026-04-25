import Dexie, { type EntityTable } from 'dexie'
import type { SrsCard } from '@/lib/srs/types'

class PtjpDb extends Dexie {
  srsCards!: EntityTable<SrsCard, 'cardId'>

  constructor() {
    super('ptjp')
    this.version(1).stores({
      // cardId is the primary key; dueAt is indexed for efficient due-card queries
      srsCards: 'cardId, dueAt',
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
