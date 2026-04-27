import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const QUIZ_ROUND_OPTIONS = [5, 10, 20] as const
export type QuizRoundSize = typeof QUIZ_ROUND_OPTIONS[number]
export type QuizKey = 'kana' | 'vocab' | 'grammar' | 'listening'

interface SettingsState {
  autoNextKana: boolean
  autoNextVocab: boolean
  autoNextGrammar: boolean
  autoNextListening: boolean
  roundSizeKana: QuizRoundSize
  roundSizeVocab: QuizRoundSize
  roundSizeGrammar: QuizRoundSize
  roundSizeListening: QuizRoundSize
  setAutoNext: (key: QuizKey, value: boolean) => void
  setRoundSize: (key: QuizKey, size: QuizRoundSize) => void
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      autoNextKana:      false,
      autoNextVocab:     false,
      autoNextGrammar:   false,
      autoNextListening: false,
      roundSizeKana:      10,
      roundSizeVocab:     10,
      roundSizeGrammar:   10,
      roundSizeListening: 10,
      setAutoNext: (key, value) => set((s) => ({
        ...s,
        [`autoNext${key.charAt(0).toUpperCase()}${key.slice(1)}`]: value,
      })),
      setRoundSize: (key, size) => set({
        [`roundSize${key.charAt(0).toUpperCase()}${key.slice(1)}`]: size,
      }),
    }),
    { name: 'ptjp-settings' },
  ),
)
