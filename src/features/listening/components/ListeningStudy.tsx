import { useReducer, useState, useEffect } from 'react'
import type { VocabCard } from '@/features/vocabulary/types'
import { speak } from '@/lib/tts/tts'

const BATCH_SIZE = 5

interface StudyState {
  deck: VocabCard[]
  index: number
  batchDone: boolean
}

type StudyAction =
  | { type: 'START'; deck: VocabCard[] }
  | { type: 'GO'; index: number }
  | { type: 'DONE' }

function reducer(_state: StudyState, action: StudyAction): StudyState {
  switch (action.type) {
    case 'START': return { deck: action.deck, index: 0, batchDone: false }
    case 'GO': return { ..._state, index: action.index }
    case 'DONE': return { ..._state, batchDone: true }
  }
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function ListeningStudy({ cards }: { cards: VocabCard[] }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => ({
    deck: shuffle(cards).slice(0, BATCH_SIZE),
    index: 0,
    batchDone: false,
  }))
  const [ttsError, setTtsError] = useState(false)
  const { deck, index, batchDone } = state

  useEffect(() => {
    dispatch({ type: 'START', deck: shuffle(cards).slice(0, BATCH_SIZE) })
  }, [cards])

  if (deck.length === 0) return null

  if (batchDone) {
    return (
      <div className="flex flex-col items-center gap-6 py-4">
        <p className="text-slate-500 text-sm">已聆聽 {BATCH_SIZE} 個單字</p>
        <button
          onClick={() => dispatch({ type: 'START', deck: shuffle(cards).slice(0, BATCH_SIZE) })}
          className="px-8 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium transition-colors"
        >
          下一組（{BATCH_SIZE} 個）
        </button>
      </div>
    )
  }

  const current = deck[index]

  function play() {
    setTtsError(false)
    speak(current.payload.reading, 'ja-JP', () => setTtsError(true))
  }

  function goTo(i: number) {
    dispatch({ type: 'GO', index: i })
    setTtsError(false)
  }

  return (
    <div className="flex flex-col items-center gap-6">
      {/* 進度 */}
      <div className="text-sm text-slate-500">第 {index + 1} / {deck.length} 張</div>

      {/* 進度條 */}
      <div className="w-full max-w-xs h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
        <div
          className="h-full rounded-full bg-orange-400 transition-all duration-300"
          style={{ width: `${(index + 1) / deck.length * 100}%` }}
        />
      </div>

      {/* 卡片 */}
      <div className="w-full max-w-xs rounded-2xl border-2 border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950 px-6 py-6 flex items-center gap-4">
        <button
          onClick={play}
          className="flex-none flex items-center justify-center w-12 h-12 rounded-full border border-orange-300 dark:border-orange-600 bg-white dark:bg-orange-900 text-orange-500 hover:bg-orange-100 dark:hover:bg-orange-800 transition-colors"
          aria-label={`播放 ${current.payload.word}`}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 0 0 1.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06ZM18.584 5.106a.75.75 0 0 1 1.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 0 1-1.06-1.06 8.25 8.25 0 0 0 0-11.668.75.75 0 0 1 0-1.06Z" />
            <path d="M15.932 7.757a.75.75 0 0 1 1.061 0 6 6 0 0 1 0 8.486.75.75 0 0 1-1.06-1.061 4.5 4.5 0 0 0 0-6.364.75.75 0 0 1 0-1.06Z" />
          </svg>
        </button>
        <div className="min-w-0 space-y-1">
          <p className="text-2xl font-medium">{current.payload.word}</p>
          <p className="text-base text-orange-400 dark:text-orange-300">{current.payload.reading}</p>
          <p className="text-sm text-slate-600 dark:text-slate-300">{current.payload.meaning}</p>
        </div>
      </div>

      {ttsError && <p className="text-red-500 text-sm">語音播放失敗，請再試一次</p>}

      {/* 導覽按鈕 */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => goTo(index - 1)}
          disabled={index === 0}
          className="px-5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          上一張
        </button>
        <button
          onClick={() => index + 1 >= deck.length ? dispatch({ type: 'DONE' }) : goTo(index + 1)}
          className="px-6 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium transition-colors"
        >
          {index + 1 >= deck.length ? '完成這組' : '下一張'}
        </button>
      </div>
    </div>
  )
}
