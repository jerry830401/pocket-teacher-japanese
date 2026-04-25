export type JlptLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1'
export type PartOfSpeech = 'noun' | 'verb' | 'i-adj' | 'na-adj' | 'adverb' | 'particle' | 'expression' | 'other'

export interface VocabPayload {
  word: string        // 日文詞（可含漢字）
  reading: string     // 平假名讀音
  meaning: string     // 中文釋義（繁體）
  pos: PartOfSpeech
}

export interface VocabCard {
  id: string          // e.g. "vocab-N5-001"
  type: 'vocabulary'
  level: JlptLevel
  payload: VocabPayload
  tags: string[]
}
