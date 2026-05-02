import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const QUIZ_ROUND_OPTIONS = [5, 10, 20] as const
export type QuizRoundSize = typeof QUIZ_ROUND_OPTIONS[number]
export type QuizKey = 'kana' | 'vocab' | 'grammar' | 'listening'
export type MascotKind = 'cat' | 'shiba'
export type CatVariant = 'black' | 'tuxedo' | 'calico' | 'orange'
interface SettingsState {
  autoNextKana: boolean
  autoNextVocab: boolean
  autoNextGrammar: boolean
  autoNextListening: boolean
  roundSizeKana: QuizRoundSize
  roundSizeVocab: QuizRoundSize
  roundSizeGrammar: QuizRoundSize
  roundSizeListening: QuizRoundSize
  mascotKind: MascotKind
  catVariant: CatVariant
  setAutoNext: (key: QuizKey, value: boolean) => void
  setRoundSize: (key: QuizKey, size: QuizRoundSize) => void
  setMascotKind: (kind: MascotKind) => void
  setCatVariant: (variant: CatVariant) => void
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
      mascotKind: 'cat',
      catVariant: 'calico',
      setAutoNext: (key, value) => set((s) => ({
        ...s,
        [`autoNext${key.charAt(0).toUpperCase()}${key.slice(1)}`]: value,
      })),
      setRoundSize: (key, size) => set({
        [`roundSize${key.charAt(0).toUpperCase()}${key.slice(1)}`]: size,
      }),
      setMascotKind: (kind) => set({ mascotKind: kind }),
      setCatVariant: (variant) => set({ catVariant: variant }),
    }),
    { name: 'ptjp-settings' },
  ),
)
