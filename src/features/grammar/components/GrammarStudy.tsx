import { useReducer, useEffect } from 'react'
import type { GrammarCard } from '../types'
import { markAsSeen } from '@/lib/db/db'

const BATCH_SIZE = 5

interface StudyState {
  deck: GrammarCard[]
  index: number
  batchDone: boolean
}

type StudyAction =
  | { type: 'START'; deck: GrammarCard[] }
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

function splitSentence(sentence: string): [string, string] {
  const idx = sentence.indexOf('___')
  if (idx === -1) return [sentence, '']
  return [sentence.slice(0, idx), sentence.slice(idx + 3)]
}

export default function GrammarStudy({ cards }: { cards: GrammarCard[] }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => ({
    deck: shuffle(cards).slice(0, BATCH_SIZE),
    index: 0,
    batchDone: false,
  }))
  const { deck, index, batchDone } = state

  useEffect(() => {
    dispatch({ type: 'START', deck: shuffle(cards).slice(0, BATCH_SIZE) })
  }, [cards])

  useEffect(() => {
    if (deck[index]) markAsSeen(deck[index].id)
  }, [deck, index])

  if (deck.length === 0) return null

  if (batchDone) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4">
        <p className="text-slate-500 text-sm">已瀏覽 {BATCH_SIZE} 個文法項目</p>
        <button
          onClick={() => dispatch({ type: 'START', deck: shuffle(cards).slice(0, BATCH_SIZE) })}
          className="px-8 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium transition-colors"
        >
          下一組（{BATCH_SIZE} 個）
        </button>
      </div>
    )
  }

  const current = deck[index]
  const [before, after] = splitSentence(current.payload.sentence)

  return (
    <div className="h-full flex flex-col justify-between py-2">
      {/* 進度區 */}
      <div className="shrink-0 space-y-2">
        <div className="text-sm text-slate-500">第 {index + 1} / {deck.length} 張</div>
        <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
          <div
            className="h-full rounded-full bg-teal-500 transition-all duration-300"
            style={{ width: `${(index + 1) / deck.length * 100}%` }}
          />
        </div>
      </div>

      {/* 卡片 */}
      <div className="flex-1 min-h-0 flex items-center justify-center">
        <div className="w-full max-w-sm rounded-2xl border-2 border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-950 px-5 py-5 space-y-3">
          <p className="text-base font-medium leading-relaxed">
            {before}
            <span className="inline-block min-w-10 mx-1 px-2 rounded border-b-2 border-teal-500 text-teal-600 dark:text-teal-300 text-center">
              {current.payload.answer}
            </span>
            {after}
          </p>
          <p className="text-sm text-teal-600 dark:text-teal-300">{current.payload.meaning}</p>
          <p className="text-xs text-teal-400 dark:text-teal-500">{current.payload.grammar}</p>
        </div>
      </div>

      {/* 導覽按鈕 */}
      <div className="shrink-0 flex items-center justify-center gap-3 pb-4">
        <button
          onClick={() => dispatch({ type: 'GO', index: index - 1 })}
          disabled={index === 0}
          className="px-5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          上一張
        </button>
        <button
          onClick={() => index + 1 >= deck.length
            ? dispatch({ type: 'DONE' })
            : dispatch({ type: 'GO', index: index + 1 })}
          className="px-6 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium transition-colors"
        >
          {index + 1 >= deck.length ? '完成這組' : '下一張'}
        </button>
      </div>
    </div>
  )
}
