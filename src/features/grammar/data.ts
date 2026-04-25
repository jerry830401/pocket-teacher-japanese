import type { GrammarCard, JlptLevel } from './types'

export async function loadGrammar(): Promise<GrammarCard[]> {
  const res = await fetch('/data/grammar.json')
  if (!res.ok) throw new Error(`Failed to load grammar data: ${res.status}`)
  return res.json() as Promise<GrammarCard[]>
}

export function filterByLevel(cards: GrammarCard[], level: JlptLevel): GrammarCard[] {
  return cards.filter((c) => c.level === level)
}
