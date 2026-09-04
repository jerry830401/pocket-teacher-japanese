// Multiple-choice distractor picker.
//
// Correctness is judged by card id, but the learner only sees the answer key
// (a meaning, a reading, a romaji). If a distractor renders the same key as the
// correct card, the question has two right-looking answers and one of them is
// marked wrong — so exclude those before sampling.

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function buildChoices<T extends { id: string }>(
  correct: T,
  pool: T[],
  answerKey: (item: T) => string,
  count = 3,
): T[] {
  const key = answerKey(correct)
  const candidates = pool.filter((c) => c.id !== correct.id && answerKey(c) !== key)
  return shuffle([correct, ...shuffle(candidates).slice(0, count)])
}
