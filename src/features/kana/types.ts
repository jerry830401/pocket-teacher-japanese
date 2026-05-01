export type KanaType = 'hiragana' | 'katakana'

export type KanaGroup =
  | 'vowel'       // あ行
  | 'k' | 'g'
  | 's' | 'z'
  | 't' | 'd'
  | 'n-row'       // な行 (避免與獨立 'n' 的 ん 混淆)
  | 'h' | 'b' | 'p'
  | 'm' | 'y' | 'r' | 'w'
  | 'n-char'      // ん／ン
  | 'combo'       // 拗音 (きゃ etc.)

export interface KanaWord {
  word: string
  reading: string
  meaning: string
  sentence: string
  sentence_meaning: string
}

export interface KanaChar {
  id: string          // e.g. "hiragana-a", "katakana-ka"
  kana: string        // あ / ア
  romaji: string      // a / ka / kya
  type: KanaType
  group: KanaGroup
  order: number       // for display ordering
  word?: KanaWord     // representative N5 word (absent for combo chars)
}

// 五十音表格用的格子（可能為空）
export interface KanaCell {
  char: KanaChar | null
}

export type KanaRow = {
  label: string       // 行標題，e.g. "あ行"
  cells: KanaCell[]   // 5 格（あいうえお順）
}
