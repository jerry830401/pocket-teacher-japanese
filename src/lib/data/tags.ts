// Single source of truth for the taxonomy used by public/data/*.json.
//
// `.claude/commands/add-data.md` and jsonSchema.test.ts both point here instead
// of keeping their own copies — three copies is how deprecated tags survived
// (`conjunction` on vocab) and how invented ones slipped in (`sport`).

/** Vocabulary topic tags. `misc` is the catch-all for abstract nouns that fit no topic. */
export const VOCAB_TAGS = [
  'greeting', 'question', 'person', 'family', 'number', 'time', 'place', 'direction',
  'food', 'body', 'home', 'clothing', 'nature', 'animal', 'weather', 'transport',
  'school', 'work', 'shopping', 'hobby', 'health', 'emotion', 'color', 'size',
  'adjective', 'verb', 'adverb', 'misc',
] as const

/**
 * Parts of speech allowed in vocabulary data. Narrower than the `PartOfSpeech`
 * type in features/vocabulary/types.ts, which keeps extra members ('particle',
 * 'expression', 'other') as runtime fallbacks for teacher hints.
 */
export const VOCAB_POS = ['noun', 'verb', 'i-adj', 'na-adj', 'adverb'] as const

/** Grammar tier 1 — the functional category. Every grammar card needs at least one. */
export const GRAMMAR_TIER1_TAGS = [
  'particle', 'copula', 'verb-form', 'adjective-form',
  'sentence-pattern', 'tense-aspect', 'conjunction', 'expression',
] as const

/** Grammar tier 2 — precise labels. Optional, but must come from this list. */
export const GRAMMAR_TIER2_TAGS = [
  // particles
  'は', 'が', 'を', 'に', 'で', 'へ', 'と', 'も', 'や', 'から', 'まで', 'の', 'か',
  'だけ', 'しか', 'でも', 'けど', 'ので', 'なら',
  // verb forms
  'te-form', 'ta-form', 'masu-form', 'nai-form',
  // tense / aspect
  'past', 'negative', 'aspect', 'もう', 'まだ', 'time', '後で', '前に', '時', '間',
  // functions
  'conditional', 'permission', 'prohibition', 'obligation', 'desire', 'ability',
  'suggestion', 'concession', 'quotation', 'simultaneous', 'purpose', 'intent',
  'habit', 'experience', 'existence', 'location', 'request', 'modality',
  // concrete grammar points
  'です', 'たい', 'できる', 'たら', 'ば', 'ています', 'てから', 'てください', 'てみる',
  'ておく', 'たことがある', 'たほうがいい', 'なければならない', 'ことができる',
  'と思います', 'と言いました', 'ように言いました', 'ながら', 'つもり', 'よう',
  'ないように', 'ようにしている', 'に行く', 'すぎ', 'やすい', 'にくい',
  'にとって', 'によって', 'によると', 'もらう', '上手', '下手', '得意', '苦手',
  // adverbs / interrogatives
  'adverb', 'interrogative', 'fixed-phrase',
  // adjective types
  'i-adj', 'na-adj',
] as const

export const VOCAB_TAG_SET: ReadonlySet<string> = new Set(VOCAB_TAGS)
export const VOCAB_POS_SET: ReadonlySet<string> = new Set(VOCAB_POS)
export const GRAMMAR_TIER1_SET: ReadonlySet<string> = new Set(GRAMMAR_TIER1_TAGS)
export const GRAMMAR_TAG_SET: ReadonlySet<string> = new Set([
  ...GRAMMAR_TIER1_TAGS,
  ...GRAMMAR_TIER2_TAGS,
])

/** Strips <ruby>/<rt> markup so a sentenceRuby can be compared against its sentence. */
export function stripRuby(sentenceRuby: string): string {
  return sentenceRuby.replace(/<rt>.*?<\/rt>/g, '').replace(/<\/?ruby>/g, '')
}
