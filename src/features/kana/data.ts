import type { KanaChar, KanaType, KanaWord } from './types'

interface RawKanaChar {
  id: string
  kana: string
  romaji: string
  group: KanaChar['group']
  order: number
  word?: KanaWord
}

interface KanaJson {
  hiragana: RawKanaChar[]
  katakana: RawKanaChar[]
}

let cache: KanaChar[] | null = null

export async function loadKana(): Promise<KanaChar[]> {
  if (cache) return cache

  const res = await fetch(`${import.meta.env.BASE_URL}data/kana.json`)
  if (!res.ok) throw new Error(`Failed to load kana data: ${res.status}`)
  const json: KanaJson = await res.json()

  const toChars = (type: KanaType) => (raw: RawKanaChar): KanaChar => ({
    ...raw,
    type,
  })

  cache = [
    ...json.hiragana.map(toChars('hiragana')),
    ...json.katakana.map(toChars('katakana')),
  ]
  return cache
}

export function filterByType(chars: KanaChar[], type: KanaType) {
  return chars.filter((c) => c.type === type)
}

export function filterByGroup(chars: KanaChar[], ...groups: KanaChar['group'][]) {
  return chars.filter((c) => groups.includes(c.group))
}

// 五十音表的行順序（不含 combo 拗音）
export const GOJUUON_ROW_ORDER: Array<{ label: string; group: KanaChar['group'] }> = [
  { label: 'あ行', group: 'vowel' },
  { label: 'か行', group: 'k' },
  { label: 'さ行', group: 's' },
  { label: 'た行', group: 't' },
  { label: 'な行', group: 'n-row' },
  { label: 'は行', group: 'h' },
  { label: 'ま行', group: 'm' },
  { label: 'や行', group: 'y' },
  { label: 'ら行', group: 'r' },
  { label: 'わ行', group: 'w' },
  { label: 'ん',   group: 'n-char' },
]

export const DAKUTEN_ROW_ORDER: Array<{ label: string; group: KanaChar['group'] }> = [
  { label: 'が行', group: 'g' },
  { label: 'ざ行', group: 'z' },
  { label: 'だ行', group: 'd' },
  { label: 'ば行', group: 'b' },
  { label: 'ぱ行', group: 'p' },
]
