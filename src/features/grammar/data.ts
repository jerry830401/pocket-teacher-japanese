import type { GrammarCard, JlptLevel } from './types'
import { getOfflineGrammar } from '@/lib/db/offlineData'

let cache: GrammarCard[] | null = null

export async function loadGrammar(): Promise<GrammarCard[]> {
  if (cache) return cache
  const offline = await getOfflineGrammar()
  if (offline) {
    cache = offline as GrammarCard[]
    return cache
  }
  const res = await fetch(`${import.meta.env.BASE_URL}data/grammar.json`)
  if (!res.ok) throw new Error(`Failed to load grammar data: ${res.status}`)
  cache = await res.json() as GrammarCard[]
  return cache
}

export function filterByLevel(cards: GrammarCard[], level: JlptLevel): GrammarCard[] {
  return cards.filter((c) => c.level === level)
}
