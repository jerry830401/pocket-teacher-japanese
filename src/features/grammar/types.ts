export type JlptLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1'

export interface GrammarPayload {
  sentence: string         // 題目句子，空格用 ___ 標示
  sentenceRuby?: string    // 含 <ruby> 標記的句子版本，漢字上方顯示平假名
  answer: string           // 正確答案
  choices: string[]        // 四個選項（含正確答案）
  meaning: string          // 整句中文翻譯
  grammar: string          // 文法說明（繁中）
}

export interface GrammarCard {
  id: string          // e.g. "grammar-N5-001"
  type: 'grammar'
  level: JlptLevel
  payload: GrammarPayload
  tags: string[]
}
