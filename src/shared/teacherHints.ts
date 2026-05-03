import type { MascotMood } from './Mascot'

// ── Vocabulary ────────────────────────────────────────────────────────────────

export const VOCAB_POS_HINTS: Record<string, string[]> = {
  noun: [
    '名詞可直接加「です」表示禮貌體。',
    '試著用這個名詞造一個句子！',
    '名詞前可加「この・その・あの」指示方向。',
  ],
  verb: [
    '動詞原形＋ます→禮貌形，試試看！',
    '記住動詞的て形，很多句型會用到。',
    '這個動詞是及物還是不及物的呢？',
  ],
  'i-adj': [
    'い形容詞變否定：去「い」加「くない」。',
    '接名詞時直接放在名詞前就好！',
    'い形容詞過去式：去「い」加「かった」。',
  ],
  'na-adj': [
    'な形容詞接名詞時中間要加「な」。',
    '變否定形：加「じゃない」或「ではない」。',
    'な形容詞的副詞形：加「に」就可以修飾動詞！',
  ],
  adverb: [
    '副詞通常放在動詞或形容詞前面。',
    '副詞不需要活用，形式固定。',
    '多用這個副詞造句，幫助記憶！',
  ],
  particle: [
    '助詞是句子的骨架，多留意它的位置！',
    '不同助詞改變句子意思，要小心區分。',
    '試著把這個助詞替換成其他助詞，感受差異。',
  ],
  expression: [
    '這是常用表現，整句一起記效果最好！',
    '日常對話中很常出現，多練習！',
    '試著想想這句話的使用場合。',
  ],
  other: [
    '多看幾遍，感受這個詞的語感。',
    '試著在例句中找到它的用法！',
    '重複朗讀有助於記憶！',
  ],
}

export const VOCAB_FIRST_HINTS = [
  '新的一組開始！一起加油！',
  '準備好了嗎？讓我們開始吧！',
]
export const VOCAB_LAST_HINTS = [
  '最後一張了，好好把握！',
  '就差這一張，衝！',
]
export const VOCAB_DONE_HINTS = [
  '這組全部看完了，做得很好！',
  '完成一組！繼續保持！',
]

// ── Grammar ───────────────────────────────────────────────────────────────────

export const GRAMMAR_HINTS = [
  '試著把空格填入，再朗讀整句！',
  '注意句子裡助詞的用法。',
  '這個文法型態在日常對話很常見！',
  '試著用這個文型自己造一個句子。',
  '反覆看幾遍，讓語感自然進來。',
]

export const GRAMMAR_FIRST_HINTS = [
  '新的一組文法，一起學！',
  '準備好迎接新的文法了嗎？',
]
export const GRAMMAR_LAST_HINTS = [
  '最後一個！仔細看清楚。',
  '快到終點了，加油！',
]
export const GRAMMAR_DONE_HINTS = [
  '這組文法全看完了，很棒！',
  '完成一組文法！繼續保持！',
]

// ── Kana ──────────────────────────────────────────────────────────────────────

export const KANA_HINTS = [
  '多唸幾遍，讓發音自然記進去！',
  '試著用手指在空中寫出這個假名。',
  '記住例字，可以幫助你記住讀音。',
  '把假名和羅馬拼音一起背，效果更好！',
  '閉上眼睛，試著回想這個假名的樣子。',
]

export const KANA_FIRST_HINTS = [
  '開始新的一行了，一起來！',
  '準備好了嗎？假名學習出發！',
]
export const KANA_LAST_HINTS = [
  '這行最後一個，好好記住它！',
  '快到終點了，衝！',
]
export const KANA_DONE_HINTS = [
  '這行全部看完了，很棒！',
  '完成一行！繼續下一行吧！',
]

// ── Home ──────────────────────────────────────────────────────────────────────

export const HOME_HINTS = [
  '今天想學什麼呢？',
  '每天一點點，慢慢就會了！',
  '選一個主題，開始今天的練習吧！',
  '繼續加油，你做得很棒！',
  '學日文最重要的是持續！',
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function getVocabMood(index: number, total: number): MascotMood {
  if (index === 0) return 'cheer'
  if (index === total - 1) return 'happy'
  return 'idle'
}

export function getVocabHint(index: number, total: number, pos: string): string {
  if (index === 0) return pick(VOCAB_FIRST_HINTS)
  if (index === total - 1) return pick(VOCAB_LAST_HINTS)
  const pool = VOCAB_POS_HINTS[pos] ?? VOCAB_POS_HINTS['other']
  return pool[index % pool.length]
}

export function getGrammarMood(index: number, total: number): MascotMood {
  if (index === 0) return 'cheer'
  if (index === total - 1) return 'happy'
  return 'idle'
}

export function getKanaMood(index: number, total: number): MascotMood {
  if (index === 0) return 'cheer'
  if (index === total - 1) return 'happy'
  return 'idle'
}

export function getKanaHint(index: number, total: number): string {
  if (index === 0) return pick(KANA_FIRST_HINTS)
  if (index === total - 1) return pick(KANA_LAST_HINTS)
  return KANA_HINTS[index % KANA_HINTS.length]
}

export function getGrammarHint(index: number, total: number): string {
  if (index === 0) return pick(GRAMMAR_FIRST_HINTS)
  if (index === total - 1) return pick(GRAMMAR_LAST_HINTS)
  return GRAMMAR_HINTS[index % GRAMMAR_HINTS.length]
}
