import type { SrsCard, ReviewQuality } from './types'

const DAY_MS = 86_400_000

export function createCard(cardId: string, now = Date.now()): SrsCard {
  return {
    cardId,
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
    dueAt: now,
    lastReviewedAt: now,
  }
}

/**
 * SM-2 algorithm: returns an updated card given a review quality (0–5).
 * quality < 3 resets repetitions (wrong answer); >= 3 advances the schedule.
 */
export function review(card: SrsCard, quality: ReviewQuality, now = Date.now()): SrsCard {
  const q = quality
  let { easeFactor, interval, repetitions } = card

  if (q < 3) {
    // Incorrect — reset streak, repeat soon
    repetitions = 0
    interval = 1
  } else {
    // Correct — advance
    if (repetitions === 0) {
      interval = 1
    } else if (repetitions === 1) {
      interval = 6
    } else {
      interval = Math.round(interval * easeFactor)
    }
    repetitions += 1
  }

  // Update ease factor (clamped to minimum 1.3)
  easeFactor = Math.max(1.3, easeFactor + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))

  return {
    ...card,
    easeFactor,
    interval,
    repetitions,
    dueAt: now + interval * DAY_MS,
    lastReviewedAt: now,
  }
}

export function isDue(card: SrsCard, now = Date.now()): boolean {
  return card.dueAt <= now
}
