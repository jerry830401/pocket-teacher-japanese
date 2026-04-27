import { useReducer, useState, useEffect, useRef, useCallback } from 'react'
import type { VocabCard } from '@/features/vocabulary/types'
import { getOrCreateCard, saveCard } from '@/lib/db/db'
import { review } from '@/lib/srs/sm2'
import { speak } from '@/lib/tts/tts'
import { useSettings } from '@/stores/useSettings'

const ROUND_SIZE = 20

interface Props {
  cards: VocabCard[]
}

interface QuizState {
  deck: VocabCard[]
  index: number
  choices: VocabCard[]
  selected: string | null
  correct: number
}

type QuizAction =
  | { type: 'START'; deck: VocabCard[]; choices: VocabCard[] }
  | { type: 'PICK'; choiceId: string; isCorrect: boolean }
  | { type: 'NEXT'; index: number; choices: VocabCard[] }

function reducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case 'START':
      return { deck: action.deck, index: 0, choices: action.choices, selected: null, correct: 0 }
    case 'PICK':
      return { ...state, selected: action.choiceId, correct: state.correct + (action.isCorrect ? 1 : 0) }
    case 'NEXT':
      return { ...state, index: action.index, choices: action.choices, selected: null }
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

function buildChoices(correct: VocabCard, pool: VocabCard[]): VocabCard[] {
  const wrong = shuffle(pool.filter((c) => c.id !== correct.id)).slice(0, 3)
  return shuffle([correct, ...wrong])
}

function buildRound(cards: VocabCard[]): { deck: VocabCard[]; choices: VocabCard[] } {
  const deck = shuffle(cards).slice(0, ROUND_SIZE)
  return { deck, choices: buildChoices(deck[0], cards) }
}

export default function ListeningQuiz({ cards }: Props) {
  const autoNext = useSettings((s) => s.autoNextListening)
  const initialRound = useRef(buildRound(cards))
  const [state, dispatch] = useReducer(reducer, {
    deck: initialRound.current.deck,
    index: 0,
    choices: initialRound.current.choices,
    selected: null,
    correct: 0,
  })
  const [roundResult, setRoundResult] = useState<{ correct: number } | null>(null)
  const [ttsError, setTtsError] = useState(false)

  useEffect(() => {
    const round = buildRound(cards)
    dispatch({ type: 'START', deck: round.deck, choices: round.choices })
    setRoundResult(null)
  }, [cards])

  const { deck, index, choices, selected, correct } = state
  const current = deck[index]

  const playCurrentWord = useCallback(() => {
    if (!current) return
    setTtsError(false)
    speak(current.payload.reading, 'ja-JP', () => setTtsError(true))
  }, [current])

  function startNextRound() {
    const round = buildRound(cards)
    dispatch({ type: 'START', deck: round.deck, choices: round.choices })
    setRoundResult(null)
  }

  function advance(nextIndex: number, finalCorrect = state.correct) {
    if (nextIndex >= deck.length) {
      setRoundResult({ correct: finalCorrect })
    } else {
      dispatch({ type: 'NEXT', index: nextIndex, choices: buildChoices(deck[nextIndex], cards) })
    }
  }

  async function pick(choice: VocabCard) {
    if (selected || !current) return
    const isCorrect = choice.id === current.id
    dispatch({ type: 'PICK', choiceId: choice.id, isCorrect })
    getOrCreateCard(current.id).then((card) => saveCard(review(card, isCorrect ? 5 : 1)))
    if (isCorrect && autoNext) {
      const next = correct + 1
      setTimeout(() => advance(index + 1, next), 400)
    }
  }

  if (roundResult !== null) {
    const pct = Math.round((roundResult.correct / deck.length) * 100)
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4">
        <span className="text-5xl font-bold text-orange-500 dark:text-orange-400">{pct}%</span>
        <span className="text-slate-500 text-sm">{deck.length} 題中答對 {roundResult.correct} 題</span>
        <div className="w-full max-w-xs rounded-2xl border border-slate-200 dark:border-slate-700 p-4 text-sm text-slate-500 text-center">
          {pct === 100 && '完美！全部答對 🎉'}
          {pct >= 80 && pct < 100 && '答得很好，再接再厲！'}
          {pct >= 60 && pct < 80 && '還不錯，繼續練習！'}
          {pct < 60 && '多練幾輪，加油！'}
        </div>
        <button
          onClick={startNextRound}
          className="px-8 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium transition-colors"
        >
          下一輪（{ROUND_SIZE} 題）
        </button>
      </div>
    )
  }

  if (!current) return null

  const isLastQuestion = index === deck.length - 1
  const showNext = selected !== null && !(autoNext && selected === current.id)

  return (
    <div className="h-full flex flex-col gap-4 py-2">
      {/* 進度區 */}
      <div className="shrink-0 space-y-2">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <span>第 {index + 1} / {deck.length} 題</span>
          <span className="text-slate-300 dark:text-slate-600">·</span>
          <span>正確 {correct}</span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
          <div
            className="h-full rounded-full bg-orange-400 transition-all duration-300"
            style={{ width: `${((index + (selected ? 1 : 0)) / deck.length) * 100}%` }}
          />
        </div>
      </div>

      {/* 題目卡 */}
      <div className="flex-1 min-h-0 flex items-center justify-center">
        <div className="flex items-center gap-5 w-full max-w-xs rounded-2xl border-2 border-orange-200 dark:border-orange-900 bg-orange-50 dark:bg-orange-950 shadow-sm px-5 py-5">
          {/* 左側：播放按鈕 */}
          <div className="shrink-0 flex flex-col items-center gap-1.5">
            <button
              onClick={playCurrentWord}
              className="flex items-center justify-center w-14 h-14 rounded-full border-2 transition-colors border-orange-400 dark:border-orange-500 bg-white dark:bg-orange-900 text-orange-500 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-800 cursor-pointer"
              aria-label="播放發音"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
                <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 0 0 1.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06ZM18.584 5.106a.75.75 0 0 1 1.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 0 1-1.06-1.06 8.25 8.25 0 0 0 0-11.668.75.75 0 0 1 0-1.06Z" />
                <path d="M15.932 7.757a.75.75 0 0 1 1.061 0 6 6 0 0 1 0 8.486.75.75 0 0 1-1.06-1.061 4.5 4.5 0 0 0 0-6.364.75.75 0 0 1 0-1.06Z" />
              </svg>
            </button>
            {ttsError
              ? <p className="text-xs text-red-500">播放失敗</p>
              : <p className="text-xs text-orange-400 dark:text-orange-500">點擊播放</p>
            }
          </div>

          {/* 分隔線 */}
          <div className="self-stretch w-px bg-orange-200 dark:bg-orange-800" />

          {/* 右側：答案揭示 */}
          <div className={`flex-1 flex flex-col gap-1 transition-opacity ${selected ? 'opacity-100' : 'opacity-0'}`}>
            <span className="text-2xl font-medium text-orange-700 dark:text-orange-300">{current.payload.word}</span>
            <span className="text-sm text-orange-500 dark:text-orange-400">{current.payload.reading}</span>
            <span className="text-sm text-orange-400 dark:text-orange-500">{current.payload.meaning}</span>
          </div>
        </div>
      </div>

      {/* 選項 + 下一題 */}
      <div className="shrink-0 flex flex-col items-center gap-8 pb-4">
        <div className="grid grid-cols-2 gap-2.5 w-full max-w-xs">
          {choices.map((choice) => {
            const isCorrect = choice.id === current.id
            const isPicked = choice.id === selected
            let cls = 'rounded-xl border-2 py-3 px-2 text-sm font-medium transition-colors '
            if (!selected) {
              cls += 'border-slate-200 dark:border-slate-700 hover:border-orange-400 dark:hover:border-orange-500 cursor-pointer'
            } else if (isCorrect) {
              cls += 'border-green-500 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300'
            } else if (isPicked) {
              cls += 'border-red-400 bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400'
            } else {
              cls += 'border-slate-200 dark:border-slate-700 opacity-40'
            }
            return (
              <button key={choice.id} className={cls} onClick={() => pick(choice)}>
                <span className="block text-base">{choice.payload.word}</span>
                <span className="block text-xs opacity-60 mt-0.5">{choice.payload.reading}</span>
              </button>
            )
          })}
        </div>

        <button
          onClick={() => advance(index + 1)}
          disabled={!showNext}
          className={`px-8 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium transition-colors ${!showNext ? 'invisible' : ''}`}
        >
          {isLastQuestion ? '查看結果' : '下一題'}
        </button>
      </div>
    </div>
  )
}
