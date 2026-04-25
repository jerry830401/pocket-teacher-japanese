import { useReducer, useState, useEffect, useMemo, useCallback } from 'react'
import type { VocabCard } from '@/features/vocabulary/types'
import { getOrCreateCard, saveCard } from '@/lib/db/db'
import { review } from '@/lib/srs/sm2'
import { speak } from '@/lib/tts/tts'

interface Props {
  cards: VocabCard[]
}

interface QuizState {
  deck: VocabCard[]
  index: number
  choices: VocabCard[]
  selected: string | null
  correct: number
  total: number
}

type QuizAction =
  | { type: 'RESET'; deck: VocabCard[]; choices: VocabCard[] }
  | { type: 'PICK'; choiceId: string; isCorrect: boolean }
  | { type: 'NEXT'; index: number; choices: VocabCard[] }

function reducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case 'RESET':
      return { deck: action.deck, index: 0, choices: action.choices, selected: null, correct: 0, total: 0 }
    case 'PICK':
      return { ...state, selected: action.choiceId, total: state.total + 1, correct: state.correct + (action.isCorrect ? 1 : 0) }
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

function buildReset(cards: VocabCard[]): QuizAction {
  const deck = shuffle(cards)
  return { type: 'RESET', deck, choices: buildChoices(deck[0], cards) }
}

export default function ListeningQuiz({ cards }: Props) {
  const [state, dispatch] = useReducer(reducer, null, () => {
    const deck = shuffle(cards)
    return { deck, index: 0, choices: buildChoices(deck[0], cards), selected: null, correct: 0, total: 0 }
  })
  const [autoNext, setAutoNext] = useState(false)
  const [playing, setPlaying] = useState(false)

  const resetAction = useMemo(() => buildReset(cards), [cards])
  useEffect(() => { dispatch(resetAction) }, [resetAction])

  const { deck, index, choices, selected, correct, total } = state
  const current = deck[index]

  const playCurrentWord = useCallback(() => {
    if (!current) return
    setPlaying(true)
    speak(current.payload.reading).finally(() => {
      setTimeout(() => setPlaying(false), 1500)
    })
  }, [current])

  // 換題時自動播放
  useEffect(() => {
    if (current) playCurrentWord()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id])

  function advance(nextIndex: number) {
    if (nextIndex >= deck.length) {
      dispatch(buildReset(cards))
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
      setTimeout(() => advance(index + 1), 400)
    }
  }

  if (!current) return null

  const isFinished = index === deck.length - 1 && selected !== null
  const showNext = selected !== null && !(autoNext && selected === current.id)

  return (
    <div className="flex flex-col items-center gap-6">
      {/* 進度 */}
      <div className="flex items-center gap-3 text-sm text-slate-500">
        <span>{index + 1} / {deck.length}</span>
        <span className="text-slate-300 dark:text-slate-600">·</span>
        <span>正確 {correct} / {total}</span>
      </div>

      {/* 題目卡：播放按鈕 */}
      <div className="flex flex-col items-center justify-center w-56 min-h-36 gap-4 rounded-2xl border-2 border-orange-200 dark:border-orange-900 bg-orange-50 dark:bg-orange-950 shadow-sm px-4 py-6">
        <button
          onClick={playCurrentWord}
          disabled={playing}
          className={[
            'flex items-center justify-center w-16 h-16 rounded-full border-2 transition-colors',
            playing
              ? 'border-orange-300 dark:border-orange-700 bg-orange-100 dark:bg-orange-900 text-orange-300 dark:text-orange-700'
              : 'border-orange-400 dark:border-orange-500 bg-white dark:bg-orange-900 text-orange-500 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-800 cursor-pointer',
          ].join(' ')}
          aria-label="播放發音"
        >
          {/* Speaker icon */}
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
            <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 0 0 1.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06ZM18.584 5.106a.75.75 0 0 1 1.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 0 1-1.06-1.06 8.25 8.25 0 0 0 0-11.668.75.75 0 0 1 0-1.06Z" />
            <path d="M15.932 7.757a.75.75 0 0 1 1.061 0 6 6 0 0 1 0 8.486.75.75 0 0 1-1.06-1.061 4.5 4.5 0 0 0 0-6.364.75.75 0 0 1 0-1.06Z" />
          </svg>
        </button>
        <p className="text-xs text-orange-400 dark:text-orange-500">點擊播放發音</p>

        {/* 答題後顯示正確答案 */}
        {selected && (
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-2xl font-medium text-orange-700 dark:text-orange-300">{current.payload.word}</span>
            <span className="text-sm text-orange-500 dark:text-orange-400">{current.payload.reading}</span>
            <span className="text-sm text-orange-400 dark:text-orange-500">{current.payload.meaning}</span>
          </div>
        )}
      </div>

      {/* 選項（日文單字） */}
      <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
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

      {/* 下一題 */}
      <button
        onClick={() => advance(index + 1)}
        disabled={!showNext}
        className={`mt-2 px-6 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium transition-colors ${!showNext ? 'invisible' : ''}`}
      >
        {isFinished ? '重新開始' : '下一題'}
      </button>

      {/* 答對自動下一題 */}
      <label className="flex items-center gap-2 text-sm text-slate-500 cursor-pointer select-none">
        <span>答對自動下一題</span>
        <button
          role="switch"
          aria-checked={autoNext}
          onClick={() => setAutoNext((v) => !v)}
          className={[
            'relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200',
            autoNext ? 'bg-orange-500' : 'bg-slate-300 dark:bg-slate-600',
          ].join(' ')}
        >
          <span className={[
            'inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200',
            autoNext ? 'translate-x-4' : 'translate-x-0',
          ].join(' ')} />
        </button>
      </label>
    </div>
  )
}
