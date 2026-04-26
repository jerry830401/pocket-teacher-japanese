import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const VALID_LEVELS = new Set(['N5', 'N4', 'N3', 'N2', 'N1'])
const VALID_POS = new Set(['noun', 'verb', 'i-adj', 'na-adj', 'adverb', 'particle', 'expression', 'other'])

function loadJson(filename: string): unknown[] {
  const path = resolve(process.cwd(), 'public/data', filename)
  return JSON.parse(readFileSync(path, 'utf-8'))
}

describe('vocabulary.json', () => {
  const cards = loadJson('vocabulary.json')

  it('is a non-empty array', () => {
    expect(Array.isArray(cards)).toBe(true)
    expect(cards.length).toBeGreaterThan(0)
  })

  it('every card has required top-level fields with correct types', () => {
    for (const card of cards) {
      const c = card as Record<string, unknown>
      expect(typeof c.id, `id in ${c.id}`).toBe('string')
      expect(c.type, `type in ${c.id}`).toBe('vocabulary')
      expect(VALID_LEVELS.has(c.level as string), `level in ${c.id}`).toBe(true)
      expect(Array.isArray(c.tags), `tags in ${c.id}`).toBe(true)
    }
  })

  it('every card has valid payload fields', () => {
    for (const card of cards) {
      const c = card as Record<string, unknown>
      const p = c.payload as Record<string, unknown>
      expect(typeof p.word, `word in ${c.id}`).toBe('string')
      expect(typeof p.reading, `reading in ${c.id}`).toBe('string')
      expect(typeof p.meaning, `meaning in ${c.id}`).toBe('string')
      expect(VALID_POS.has(p.pos as string), `pos "${p.pos}" in ${c.id}`).toBe(true)
    }
  })

  it('id format matches vocab-{LEVEL}-{NNN}', () => {
    const pattern = /^vocab-(N[1-5])-\d+$/
    for (const card of cards) {
      const c = card as Record<string, unknown>
      expect(pattern.test(c.id as string), `bad id: ${c.id}`).toBe(true)
    }
  })

  it('has no duplicate IDs', () => {
    const ids = cards.map((c) => (c as Record<string, unknown>).id as string)
    const unique = new Set(ids)
    expect(unique.size).toBe(ids.length)
  })

  it('reading contains only hiragana and allowed punctuation', () => {
    // Hiragana: ぀-ゟ, small variants, elongation mark, common punctuation
    const pattern = /^[぀-ゟー゠-ヿー・〜をん\s]+$/
    for (const card of cards) {
      const c = card as Record<string, unknown>
      const p = c.payload as Record<string, unknown>
      const reading = p.reading as string
      // Allow empty readings for kana-only words (reading == word)
      if (reading.length > 0) {
        expect(
          /^[぀-ゟー]+$/.test(reading) || reading === (p.word as string),
          `non-hiragana reading "${reading}" in ${c.id}`,
        ).toBe(true)
      }
    }
  })
})

describe('grammar.json', () => {
  const cards = loadJson('grammar.json')

  it('is a non-empty array', () => {
    expect(Array.isArray(cards)).toBe(true)
    expect(cards.length).toBeGreaterThan(0)
  })

  it('every card has required top-level fields with correct types', () => {
    for (const card of cards) {
      const c = card as Record<string, unknown>
      expect(typeof c.id, `id in ${c.id}`).toBe('string')
      expect(c.type, `type in ${c.id}`).toBe('grammar')
      expect(VALID_LEVELS.has(c.level as string), `level in ${c.id}`).toBe(true)
      expect(Array.isArray(c.tags), `tags in ${c.id}`).toBe(true)
    }
  })

  it('every card has valid payload fields', () => {
    for (const card of cards) {
      const c = card as Record<string, unknown>
      const p = c.payload as Record<string, unknown>
      expect(typeof p.sentence, `sentence in ${c.id}`).toBe('string')
      expect(typeof p.answer, `answer in ${c.id}`).toBe('string')
      expect(typeof p.meaning, `meaning in ${c.id}`).toBe('string')
      expect(typeof p.grammar, `grammar in ${c.id}`).toBe('string')
      expect(Array.isArray(p.choices), `choices in ${c.id}`).toBe(true)
    }
  })

  it('sentence contains exactly one blank (___)', () => {
    for (const card of cards) {
      const c = card as Record<string, unknown>
      const p = c.payload as Record<string, unknown>
      const sentence = p.sentence as string
      const blanks = (sentence.match(/___/g) ?? []).length
      expect(blanks, `blank count in ${c.id}: "${sentence}"`).toBe(1)
    }
  })

  it('choices has exactly 4 items with no duplicates', () => {
    for (const card of cards) {
      const c = card as Record<string, unknown>
      const p = c.payload as Record<string, unknown>
      const choices = p.choices as string[]
      expect(choices.length, `choices length in ${c.id}`).toBe(4)
      expect(new Set(choices).size, `duplicate choices in ${c.id}`).toBe(4)
    }
  })

  it('answer appears in choices', () => {
    for (const card of cards) {
      const c = card as Record<string, unknown>
      const p = c.payload as Record<string, unknown>
      expect(
        (p.choices as string[]).includes(p.answer as string),
        `answer "${p.answer}" not in choices ${JSON.stringify(p.choices)} for ${c.id}`,
      ).toBe(true)
    }
  })

  it('id format matches grammar-{LEVEL}-{NNN}', () => {
    const pattern = /^grammar-(N[1-5])-\d+$/
    for (const card of cards) {
      const c = card as Record<string, unknown>
      expect(pattern.test(c.id as string), `bad id: ${c.id}`).toBe(true)
    }
  })

  it('has no duplicate IDs', () => {
    const ids = cards.map((c) => (c as Record<string, unknown>).id as string)
    const unique = new Set(ids)
    expect(unique.size).toBe(ids.length)
  })
})
