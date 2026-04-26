import type { VocabCard, JlptLevel } from './types'

let cache: VocabCard[] | null = null

export async function loadVocabulary(): Promise<VocabCard[]> {
  if (cache) return cache
  const res = await fetch(`${import.meta.env.BASE_URL}data/vocabulary.json`)
  if (!res.ok) throw new Error(`Failed to load vocabulary data: ${res.status}`)
  cache = await res.json() as VocabCard[]
  return cache
}

export function filterByLevel(cards: VocabCard[], level: JlptLevel): VocabCard[] {
  return cards.filter((c) => c.level === level)
}
