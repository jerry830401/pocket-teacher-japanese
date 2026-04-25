import { describe, it, expect } from 'vitest'
import { createCard, review, isDue } from './sm2'

const NOW = 1_000_000_000_000 // fixed timestamp for deterministic tests
const DAY = 86_400_000

describe('createCard', () => {
  it('initialises with SM-2 defaults', () => {
    const card = createCard('test-id', NOW)
    expect(card.cardId).toBe('test-id')
    expect(card.easeFactor).toBe(2.5)
    expect(card.interval).toBe(0)
    expect(card.repetitions).toBe(0)
    expect(card.dueAt).toBe(NOW)
  })
})

describe('review — correct answers (quality >= 3)', () => {
  it('first correct review sets interval to 1 day', () => {
    const card = createCard('c', NOW)
    const updated = review(card, 5, NOW)
    expect(updated.repetitions).toBe(1)
    expect(updated.interval).toBe(1)
    expect(updated.dueAt).toBe(NOW + DAY)
  })

  it('second correct review sets interval to 6 days', () => {
    const card = review(createCard('c', NOW), 5, NOW)
    const updated = review(card, 5, NOW)
    expect(updated.repetitions).toBe(2)
    expect(updated.interval).toBe(6)
  })

  it('third correct review multiplies interval by ease factor', () => {
    let card = createCard('c', NOW)
    card = review(card, 5, NOW) // interval 1
    card = review(card, 5, NOW) // interval 6
    const efBefore = card.easeFactor
    const updated = review(card, 5, NOW)
    expect(updated.interval).toBe(Math.round(6 * efBefore))
    expect(updated.repetitions).toBe(3)
  })

  it('ease factor increases on quality 5', () => {
    const card = createCard('c', NOW)
    const updated = review(card, 5, NOW)
    expect(updated.easeFactor).toBeGreaterThan(2.5)
  })

  it('ease factor decreases on quality 3', () => {
    const card = createCard('c', NOW)
    const updated = review(card, 3, NOW)
    expect(updated.easeFactor).toBeLessThan(2.5)
  })
})

describe('review — incorrect answers (quality < 3)', () => {
  it('resets repetitions and sets interval to 1', () => {
    let card = createCard('c', NOW)
    card = review(card, 5, NOW)
    card = review(card, 5, NOW) // repetitions = 2, interval = 6
    const failed = review(card, 1, NOW)
    expect(failed.repetitions).toBe(0)
    expect(failed.interval).toBe(1)
  })

  it('ease factor decreases on quality 1', () => {
    const card = createCard('c', NOW)
    const updated = review(card, 1, NOW)
    expect(updated.easeFactor).toBeLessThan(2.5)
  })

  it('ease factor never drops below 1.3', () => {
    let card = createCard('c', NOW)
    for (let i = 0; i < 20; i++) card = review(card, 0, NOW)
    expect(card.easeFactor).toBeGreaterThanOrEqual(1.3)
  })
})

describe('isDue', () => {
  it('returns true when dueAt <= now', () => {
    const card = createCard('c', NOW)
    expect(isDue(card, NOW)).toBe(true)
    expect(isDue(card, NOW + 1)).toBe(true)
  })

  it('returns false when dueAt > now', () => {
    const card = review(createCard('c', NOW), 5, NOW) // dueAt = NOW + 1 day
    expect(isDue(card, NOW)).toBe(false)
  })
})
