import { useReducer, useState, useEffect, useMemo } from 'react'
import type { KanaChar } from '../types'
import { getOrCreateCard, saveCard } from '@/lib/db/db'
import { review } from '@/lib/srs/sm2'

type Mode = 'kana→romaji' | 'romaji→kana'

interface Props {
  chars: KanaChar[]
  mode: Mode
}

interface QuizState {
  deck: KanaChar[]
  index: number
  choices: KanaChar[]
  selected: string | null
  correct: number
  total: number
}

type QuizAction =
  | { type: 'RESET'; deck: KanaChar[]; choices: KanaChar[] }
  | { type: 'PICK'; choiceId: string; isCorrect: boolean }
  | { type: 'NEXT'; index: number; choices: KanaChar[] }

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

function buildChoices(correct: KanaChar, pool: KanaChar[]): KanaChar[] {
  const wrong = shuffle(pool.filter((c) => c.id !== correct.id)).slice(0, 3)
  return shuffle([correct, ...wrong])
}

function buildReset(chars: KanaChar[]): QuizAction {
  const deck = shuffle(chars)
  return { type: 'RESET', deck, choices: buildChoices(deck[0], chars) }
}

export default function FlashCardQuiz({ chars, mode }: Props) {
  const [state, dispatch] = useReducer(reducer, null, () => {
    const deck = shuffle(chars)
    return { deck, index: 0, choices: buildChoices(deck[0], chars), selected: null, correct: 0, total: 0 }
  })
  const [autoNext, setAutoNext] = useState(false)

  // Reset when chars or mode changes (derived from props, not internal state)
  const resetAction = useMemo(() => buildReset(chars), [chars])
  useEffect(() => { dispatch(resetAction) }, [resetAction])

  const { deck, index, choices, selected, correct, total } = state
  const current = deck[index]

  function advance(nextIndex: number) {
    if (nextIndex >= deck.length) {
      dispatch(buildReset(chars))
    } else {
      dispatch({ type: 'NEXT', index: nextIndex, choices: buildChoices(deck[nextIndex], chars) })
    }
  }

  async function pick(choice: KanaChar) {
    if (selected || !current) return
    const isCorrect = choice.id === current.id
    dispatch({ type: 'PICK', choiceId: choice.id, isCorrect })

    getOrCreateCard(current.id).then((card) => saveCard(review(card, isCorrect ? 5 : 1)))

    if (isCorrect && autoNext) {
      // Brief flash so user sees the green highlight before advancing
      setTimeout(() => advance(index + 1), 400)
    }
  }

  if (!current) return null

  const isFinished = index === deck.length - 1 && selected !== null
  const prompt = mode === 'kana→romaji' ? current.kana : current.romaji
  const answerKey = (c: KanaChar) => mode === 'kana→romaji' ? c.romaji : c.kana

  // When autoNext is on and answer is correct, hide the next button
  const showNext = selected !== null && !(autoNext && selected === current.id)

  return (
    <div className="flex flex-col items-center gap-6">
      {/* 進度 */}
      <div className="flex items-center gap-3 text-sm text-slate-500">
        <span>{index + 1} / {deck.length}</span>
        <span className="text-slate-300 dark:text-slate-600">·</span>
        <span>正確 {correct} / {total}</span>
      </div>

      {/* 題目卡 */}
      <div className="flex items-center justify-center w-40 h-40 rounded-2xl border-2 border-indigo-200 dark:border-indigo-900 bg-indigo-50 dark:bg-indigo-950 shadow-sm">
        <span className="text-6xl">{prompt}</span>
      </div>

      {/* 選項 */}
      <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
        {choices.map((choice) => {
          const isCorrect = choice.id === current.id
          const isPicked = choice.id === selected
          let cls = 'rounded-xl border-2 py-3 text-lg font-medium transition-colors '
          if (!selected) {
            cls += 'border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 cursor-pointer'
          } else if (isCorrect) {
            cls += 'border-green-500 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300'
          } else if (isPicked) {
            cls += 'border-red-400 bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400'
          } else {
            cls += 'border-slate-200 dark:border-slate-700 opacity-40'
          }
          return (
            <button key={choice.id} className={cls} onClick={() => pick(choice)}>
              {answerKey(choice)}
            </button>
          )
        })}
      </div>

      {/* 下一題 — always reserves space so layout doesn't shift on mobile */}
      <button
        onClick={() => advance(index + 1)}
        disabled={!showNext}
        className={`mt-2 px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors ${!showNext ? 'invisible' : ''}`}
      >
        {isFinished ? '重新開始' : '下一題'}
      </button>

      {/* 自動下一題開關 */}
      <label className="flex items-center gap-2 text-sm text-slate-500 cursor-pointer select-none">
        <span>答對自動下一題</span>
        <button
          role="switch"
          aria-checked={autoNext}
          onClick={() => setAutoNext((v) => !v)}
          className={[
            'relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200',
            autoNext ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600',
          ].join(' ')}
        >
          <span
            className={[
              'inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200',
              autoNext ? 'translate-x-4' : 'translate-x-0',
            ].join(' ')}
          />
        </button>
      </label>
    </div>
  )
}
