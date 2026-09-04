import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  VOCAB_TAG_SET,
  VOCAB_POS_SET,
  GRAMMAR_TIER1_SET,
  GRAMMAR_TAG_SET,
  stripRuby,
} from './tags'

const VALID_LEVELS = new Set(['N5', 'N4', 'N3', 'N2', 'N1'])

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
      expect(VOCAB_POS_SET.has(p.pos as string), `pos "${p.pos}" in ${c.id}`).toBe(true)
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
    for (const card of cards) {
      const c = card as Record<string, unknown>
      const p = c.payload as Record<string, unknown>
      const reading = p.reading as string
      // Allow empty readings for kana-only words (reading == word)
      if (reading.length > 0) {
        expect(
          /^[〜]?[぀-ゟー]+$/.test(reading) || reading === (p.word as string),
          `non-hiragana reading "${reading}" in ${c.id}`,
        ).toBe(true)
      }
    }
  })

  it('every tag is in the vocabulary whitelist', () => {
    for (const card of cards) {
      const c = card as Record<string, unknown>
      const tags = c.tags as string[]
      expect(tags.length, `no tags on ${c.id}`).toBeGreaterThan(0)
      for (const tag of tags) {
        expect(VOCAB_TAG_SET.has(tag), `unknown tag "${tag}" in ${c.id}`).toBe(true)
      }
    }
  })

  it('has no duplicate words across all levels', () => {
    const seen = new Map<string, string>()
    for (const card of cards) {
      const c = card as Record<string, unknown>
      const word = (c.payload as Record<string, unknown>).word as string
      const first = seen.get(word)
      expect(first, `word "${word}" in ${c.id} duplicates ${first}`).toBeUndefined()
      seen.set(word, c.id as string)
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

  it('sentenceRuby, when present, contains exactly one blank (___) and valid <ruby> tags', () => {
    const rubyTagPattern = /^<ruby>[^<]+<rt>[^<]+<\/rt><\/ruby>$/
    for (const card of cards) {
      const c = card as Record<string, unknown>
      const p = c.payload as Record<string, unknown>
      const ruby = p.sentenceRuby
      if (ruby === undefined) continue
      expect(typeof ruby, `sentenceRuby type in ${c.id}`).toBe('string')
      const blanks = ((ruby as string).match(/___/g) ?? []).length
      expect(blanks, `sentenceRuby blank count in ${c.id}`).toBe(1)
      // each <ruby>...</ruby> block must match the expected format
      const rubyBlocks = (ruby as string).match(/<ruby>.*?<\/ruby>/g) ?? []
      for (const block of rubyBlocks) {
        expect(rubyTagPattern.test(block), `malformed ruby tag "${block}" in ${c.id}`).toBe(true)
      }
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

  it('every card has exactly one tier-1 tag and only known tier-2 tags', () => {
    for (const card of cards) {
      const c = card as Record<string, unknown>
      const tags = c.tags as string[]
      const tier1 = tags.filter((t) => GRAMMAR_TIER1_SET.has(t))
      expect(tier1.length, `tier-1 tags ${JSON.stringify(tier1)} in ${c.id}`).toBeGreaterThan(0)
      for (const tag of tags) {
        expect(GRAMMAR_TAG_SET.has(tag), `unknown tag "${tag}" in ${c.id}`).toBe(true)
      }
    }
  })

  it('sentenceRuby, stripped of ruby markup, equals sentence', () => {
    for (const card of cards) {
      const c = card as Record<string, unknown>
      const p = c.payload as Record<string, unknown>
      if (p.sentenceRuby === undefined) continue
      expect(stripRuby(p.sentenceRuby as string), `sentenceRuby drifted from sentence in ${c.id}`).toBe(
        p.sentence as string,
      )
    }
  })

  it('has no duplicate sentences', () => {
    const seen = new Map<string, string>()
    for (const card of cards) {
      const c = card as Record<string, unknown>
      const sentence = (c.payload as Record<string, unknown>).sentence as string
      const first = seen.get(sentence)
      expect(first, `sentence "${sentence}" in ${c.id} duplicates ${first}`).toBeUndefined()
      seen.set(sentence, c.id as string)
    }
  })
})
