import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SettingsState {
  autoNextKana: boolean
  autoNextVocab: boolean
  autoNextGrammar: boolean
  autoNextListening: boolean
  setAutoNext: (key: 'kana' | 'vocab' | 'grammar' | 'listening', value: boolean) => void
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      autoNextKana:      false,
      autoNextVocab:     false,
      autoNextGrammar:   false,
      autoNextListening: false,
      setAutoNext: (key, value) => set((s) => ({
        ...s,
        [`autoNext${key.charAt(0).toUpperCase()}${key.slice(1)}`]: value,
      })),
    }),
    { name: 'ptjp-settings' },
  ),
)
