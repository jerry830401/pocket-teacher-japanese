import { describe, it, expect } from 'vitest'
import { buildChoices } from './buildChoices'

type Card = { id: string; meaning: string }
const key = (c: Card) => c.meaning

describe('buildChoices', () => {
  it('never offers a distractor with the same answer key as the correct card', () => {
    const correct: Card = { id: 'a', meaning: '工作' }
    const pool: Card[] = [correct, { id: 'b', meaning: '工作' }, { id: 'c', meaning: '休息' }, { id: 'd', meaning: '運動' }]

    for (let i = 0; i < 50; i++) {
      const choices = buildChoices(correct, pool, key)
      expect(choices.filter((c) => c.meaning === '工作')).toHaveLength(1)
      expect(choices).toContain(correct)
    }
  })

  it('returns the correct card plus up to `count` distractors', () => {
    const correct: Card = { id: 'a', meaning: 'a' }
    const pool = [correct, ...Array.from({ length: 10 }, (_, i) => ({ id: `x${i}`, meaning: `m${i}` }))]
    expect(buildChoices(correct, pool, key)).toHaveLength(4)
  })

  it('degrades gracefully when the pool has too few distinct keys', () => {
    const correct: Card = { id: 'a', meaning: 'same' }
    const pool: Card[] = [correct, { id: 'b', meaning: 'same' }, { id: 'c', meaning: 'other' }]
    const choices = buildChoices(correct, pool, key)
    expect(choices).toHaveLength(2)
    expect(choices).toContain(correct)
  })
})
