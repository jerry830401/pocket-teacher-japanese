export interface SrsCard {
  cardId: string       // matches Card.id in each feature
  easeFactor: number   // SM-2 E-Factor, starts at 2.5
  interval: number     // days until next review
  repetitions: number  // consecutive correct reviews
  dueAt: number        // Unix ms timestamp
  lastReviewedAt: number
}

// Quality rating passed to sm2(): 0–5
// 0-2 = incorrect (different severity), 3-5 = correct (different ease)
export type ReviewQuality = 0 | 1 | 2 | 3 | 4 | 5
