import type { VocabCard, JlptLevel } from './types'
import { getOfflineVocab } from '@/lib/db/offlineData'

let cache: VocabCard[] | null = null

export function invalidateVocabCache() {
  cache = null
}

export async function loadVocabulary(): Promise<VocabCard[]> {
  if (cache) return cache
  const offline = await getOfflineVocab()
  if (offline) {
    cache = offline as VocabCard[]
    return cache
  }
  const res = await fetch(`${import.meta.env.BASE_URL}data/vocabulary.json`)
  if (!res.ok) throw new Error(`Failed to load vocabulary data: ${res.status}`)
  cache = await res.json() as VocabCard[]
  return cache
}

export function filterByLevel(cards: VocabCard[], level: JlptLevel): VocabCard[] {
  return cards.filter((c) => c.level === level)
}
