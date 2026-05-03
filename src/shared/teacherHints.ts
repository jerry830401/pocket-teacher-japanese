import type { MascotMood } from './Mascot'

// ── Vocabulary ────────────────────────────────────────────────────────────────

export const VOCAB_POS_HINTS: Record<string, string[]> = {
  noun: [
    '名詞可直接加「です」表示禮貌體。',
    '試著用這個名詞造一個句子！',
    '名詞前可加「この・その・あの」指示方向。',
    '名詞加「も」可以表示「也」的意思。',
    '把這個詞和圖像連結，更容易記住！',
    '名詞加「が好き」就能表達喜歡！',
  ],
  verb: [
    '動詞原形＋ます→禮貌形，試試看！',
    '記住動詞的て形，很多句型會用到。',
    '這個動詞是及物還是不及物的呢？',
    '動詞加「たい」表示想做某事。',
    '試著把這個動詞變成て形！',
    'ない形也很重要，試著想想怎麼變。',
    '動詞的た形就是過去式，記得嗎？',
  ],
  'i-adj': [
    'い形容詞變否定：去「い」加「くない」。',
    '接名詞時直接放在名詞前就好！',
    'い形容詞過去式：去「い」加「かった」。',
    'い形容詞加「て」可以連接句子。',
    '試著用這個形容詞描述身邊的東西！',
    'い形容詞副詞形：去「い」加「く」。',
  ],
  'na-adj': [
    'な形容詞接名詞時中間要加「な」。',
    '變否定形：加「じゃない」或「ではない」。',
    'な形容詞的副詞形：加「に」就可以修飾動詞！',
    'な形容詞過去式：加「でした」。',
    '試著造一個用這個形容詞的句子！',
    'な形容詞和い形容詞的差別，有感覺了嗎？',
  ],
  adverb: [
    '副詞通常放在動詞或形容詞前面。',
    '副詞不需要活用，形式固定。',
    '多用這個副詞造句，幫助記憶！',
    '副詞可以讓句子更生動，多活用！',
    '把這個副詞加進昨天學過的句子試試！',
    '副詞放錯位置意思會變，多留意！',
  ],
  particle: [
    '助詞是句子的骨架，多留意它的位置！',
    '不同助詞改變句子意思，要小心區分。',
    '試著把這個助詞替換成其他助詞，感受差異。',
    '助詞搭配固定，多看例句是最快的方式。',
    '遇到不確定的助詞，先查例句再記！',
    '助詞沒有活用，記住用法就夠了！',
  ],
  expression: [
    '這是常用表現，整句一起記效果最好！',
    '日常對話中很常出現，多練習！',
    '試著想想這句話的使用場合。',
    '在腦中模擬一個使用這句話的情境！',
    '這種表現聽起來很自然，直接背下來吧！',
    '和朋友練習時可以試著用這句話！',
  ],
  other: [
    '多看幾遍，感受這個詞的語感。',
    '試著在例句中找到它的用法！',
    '重複朗讀有助於記憶！',
    '把這個詞用在自己的句子裡試試！',
    '不用急，慢慢感受這個詞的用法。',
    '和已經學過的詞比較看看，有什麼不同？',
  ],
}

export const VOCAB_FIRST_HINTS = [
  '新的一組開始！一起加油！',
  '準備好了嗎？讓我們開始吧！',
  '新的單字來了，專心看！',
  '加油，每個單字都是進步的一步！',
]
export const VOCAB_LAST_HINTS = [
  '最後一張了，好好把握！',
  '就差這一張，衝！',
  '最後一個！記住它就完成了！',
  '快到了，撐住！',
]
export const VOCAB_DONE_HINTS = [
  '這組全部看完了，做得很好！',
  '完成一組！繼續保持！',
  '太棒了！這組單字都看過了！',
  '一組完成！休息一下再繼續？',
  '每看完一組都是進步，很好！',
]

// ── Grammar ───────────────────────────────────────────────────────────────────

export const GRAMMAR_HINTS = [
  '試著把空格填入，再朗讀整句！',
  '注意句子裡助詞的用法。',
  '這個文法型態在日常對話很常見！',
  '試著用這個文型自己造一個句子。',
  '反覆看幾遍，讓語感自然進來。',
  '把整句話大聲唸出來，記得更快！',
  '這個文型有固定搭配，注意前後的詞！',
  '先理解意思，再記形式，效果更好。',
]

export const GRAMMAR_FIRST_HINTS = [
  '新的一組文法，一起學！',
  '準備好迎接新的文法了嗎？',
  '文法是日文的骨架，加油！',
  '新的文法來了，仔細看！',
]
export const GRAMMAR_LAST_HINTS = [
  '最後一個！仔細看清楚。',
  '快到終點了，加油！',
  '最後一條文法，記住它！',
  '撐住，就差這一個了！',
]
export const GRAMMAR_DONE_HINTS = [
  '這組文法全看完了，很棒！',
  '完成一組文法！繼續保持！',
  '文法一條一條累積，你做得很好！',
  '這組文法搞定了，繼續下一組？',
  '學文法需要耐心，你做到了！',
]

// ── Kana ──────────────────────────────────────────────────────────────────────

export const KANA_HINTS = [
  '多唸幾遍，讓發音自然記進去！',
  '試著用手指在空中寫出這個假名。',
  '記住例字，可以幫助你記住讀音。',
  '把假名和羅馬拼音一起背，效果更好！',
  '閉上眼睛，試著回想這個假名的樣子。',
  '假名是日文的基礎，打好基礎很重要！',
  '試著把這個假名和一個圖像連結起來。',
  '反覆看，形狀自然就記住了！',
]

export const KANA_FIRST_HINTS = [
  '開始新的一行了，一起來！',
  '準備好了嗎？假名學習出發！',
  '新的一行假名，加油！',
  '假名不難，慢慢就會了！',
]
export const KANA_LAST_HINTS = [
  '這行最後一個，好好記住它！',
  '快到終點了，衝！',
  '最後一個假名，記住就完成這行了！',
  '就差這一個，加油！',
]
export const KANA_DONE_HINTS = [
  '這行全部看完了，很棒！',
  '完成一行！繼續下一行吧！',
  '這行假名都看過了，做得很好！',
  '一行搞定！繼續下去吧！',
  '慢慢來，每行都是進步！',
]

// ── Quiz ──────────────────────────────────────────────────────────────────────

export const QUIZ_FIRST_HINTS = [
  '測驗開始！仔細看題目再選！',
  '準備好了嗎？開始作答吧！',
  '深呼吸，你準備好了！',
  '記得學過的，相信自己！',
]
export const QUIZ_LAST_HINTS = [
  '最後一題了，加油！',
  '就差這一題，沉住氣！',
  '最後一題！認真想清楚再選！',
  '快到終點了，衝！',
]
export const QUIZ_HINTS = [
  '不確定的話，先刪去法試試！',
  '慢慢來，仔細想清楚。',
  '相信自己的直覺！',
  '每一題都是學習的機會。',
  '不知道也沒關係，猜猜看也是練習！',
  '把四個選項都讀一遍再選。',
  '想想學習時看到的例句，有沒有印象？',
  '別緊張，一題一題來。',
]
export const QUIZ_CORRECT_HINTS = [
  '答對了！繼續保持！',
  '完全正確！真厲害！',
  '太好了，就是這個！',
  '沒問題！繼續下一題！',
  '答對！你真的記住了！',
  '正確！這個詞你掌握得很好！',
  '耶！完全正確！',
  '答對了，繼續這個節奏！',
]
export const QUIZ_WRONG_HINTS = [
  '這次差一點，記住正確答案喔！',
  '沒關係，錯了才會記住！',
  '下次一定行的！',
  '記住這個，下次就對了！',
  '別灰心，再看一眼正確答案！',
  '這題有點難，沒關係繼續！',
  '錯誤是學習的一部分，加油！',
  '下次看到這題，你一定記得！',
]
export const QUIZ_DONE_HIGH_HINTS = [
  '太強了！幾乎全對！',
  '滿分等級！繼續加油！',
  '這個成績超棒的，你真的學進去了！',
  '太厲害了！完全掌握這個主題！',
  '這樣的表現讓人刮目相看！',
]
export const QUIZ_DONE_MID_HINTS = [
  '答得不錯！繼續練習進步更快！',
  '很好的成績，再來一輪更厲害！',
  '不錯喔！再多練幾次一定能全對！',
  '有進步的空間，繼續努力！',
  '一半以上答對，基礎打得不錯！',
]
export const QUIZ_DONE_LOW_HINTS = [
  '多練幾輪，一定會越來越好！',
  '沒關係，複習是進步的關鍵！',
  '這些詞再多看幾遍，下次一定更好！',
  '別氣餒，再來一輪試試！',
  '每次練習都有幫助，繼續加油！',
]

// ── Home ──────────────────────────────────────────────────────────────────────

export const HOME_HINTS = [
  '今天想學什麼呢？',
  '每天一點點，慢慢就會了！',
  '選一個主題，開始今天的練習吧！',
  '繼續加油，你做得很棒！',
  '學日文最重要的是持續！',
  '今天也來學一點日文吧！',
  '選個主題，馬上出發！',
  '你已經進步很多了，繼續！',
  '不用學很多，學一點就很好！',
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

export function getQuizMood(selected: string | null, isCorrect: boolean | null, index: number, total: number): MascotMood {
  if (selected !== null) return isCorrect ? 'happy' : 'sad'
  if (index === 0) return 'cheer'
  if (index === total - 1) return 'idle'
  return 'idle'
}

export function getQuizHint(selected: string | null, isCorrect: boolean | null, index: number, total: number): string {
  if (selected !== null) return pick(isCorrect ? QUIZ_CORRECT_HINTS : QUIZ_WRONG_HINTS)
  if (index === 0) return pick(QUIZ_FIRST_HINTS)
  if (index === total - 1) return pick(QUIZ_LAST_HINTS)
  return QUIZ_HINTS[index % QUIZ_HINTS.length]
}

export function getQuizDoneMood(pct: number): MascotMood {
  if (pct === 100) return 'happy'
  if (pct >= 60) return 'idle'
  return 'sad'
}

export function getQuizDoneHint(pct: number): string {
  if (pct >= 80) return pick(QUIZ_DONE_HIGH_HINTS)
  if (pct >= 60) return pick(QUIZ_DONE_MID_HINTS)
  return pick(QUIZ_DONE_LOW_HINTS)
}
