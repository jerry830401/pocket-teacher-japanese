import type { VocabCard, JlptLevel } from './types'

export async function loadVocabulary(): Promise<VocabCard[]> {
  const res = await fetch(`${import.meta.env.BASE_URL}data/vocabulary.json`)
  if (!res.ok) throw new Error(`Failed to load vocabulary data: ${res.status}`)
  return res.json() as Promise<VocabCard[]>
}

export function filterByLevel(cards: VocabCard[], level: JlptLevel): VocabCard[] {
  return cards.filter((c) => c.level === level)
}
