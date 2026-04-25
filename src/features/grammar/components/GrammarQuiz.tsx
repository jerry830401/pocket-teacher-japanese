import { useReducer, useState, useEffect, useMemo } from 'react'
import type { GrammarCard } from '../types'
import { getOrCreateCard, saveCard } from '@/lib/db/db'
import { review } from '@/lib/srs/sm2'

interface Props {
  cards: GrammarCard[]
}

interface QuizState {
  deck: GrammarCard[]
  index: number
  selected: string | null
  correct: number
  total: number
}

type QuizAction =
  | { type: 'RESET'; deck: GrammarCard[] }
  | { type: 'PICK'; choiceId: string; isCorrect: boolean }
  | { type: 'NEXT'; index: number }

function reducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case 'RESET':
      return { deck: action.deck, index: 0, selected: null, correct: 0, total: 0 }
    case 'PICK':
      return { ...state, selected: action.choiceId, total: state.total + 1, correct: state.correct + (action.isCorrect ? 1 : 0) }
    case 'NEXT':
      return { ...state, index: action.index, selected: null }
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

function buildReset(cards: GrammarCard[]): QuizAction {
  return { type: 'RESET', deck: shuffle(cards) }
}

// 把 ___ 切成前後兩段，方便渲染空格
function splitSentence(sentence: string): [string, string] {
  const idx = sentence.indexOf('___')
  if (idx === -1) return [sentence, '']
  return [sentence.slice(0, idx), sentence.slice(idx + 3)]
}

export default function GrammarQuiz({ cards }: Props) {
  const [state, dispatch] = useReducer(reducer, null, () => ({
    deck: shuffle(cards), index: 0, selected: null, correct: 0, total: 0,
  }))
  const [autoNext, setAutoNext] = useState(false)

  const resetAction = useMemo(() => buildReset(cards), [cards])
  useEffect(() => { dispatch(resetAction) }, [resetAction])

  const { deck, index, selected, correct, total } = state
  const current = deck[index]

  function advance(nextIndex: number) {
    if (nextIndex >= deck.length) {
      dispatch(buildReset(cards))
    } else {
      dispatch({ type: 'NEXT', index: nextIndex })
    }
  }

  async function pick(choice: string) {
    if (selected || !current) return
    const isCorrect = choice === current.payload.answer
    dispatch({ type: 'PICK', choiceId: choice, isCorrect })
    getOrCreateCard(current.id).then((card) => saveCard(review(card, isCorrect ? 5 : 1)))
    if (isCorrect && autoNext) {
      setTimeout(() => advance(index + 1), 400)
    }
  }

  if (!current) return null

  const [before, after] = splitSentence(current.payload.sentence)
  const shuffledChoices = useMemo(
    () => shuffle(current.payload.choices),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [current.id],
  )
  const isFinished = index === deck.length - 1 && selected !== null
  const showNext = selected !== null && !(autoNext && selected === current.payload.answer)

  return (
    <div className="flex flex-col items-center gap-6">
      {/* 進度 */}
      <div className="flex items-center gap-3 text-sm text-slate-500">
        <span>{index + 1} / {deck.length}</span>
        <span className="text-slate-300 dark:text-slate-600">·</span>
        <span>正確 {correct} / {total}</span>
      </div>

      {/* 題目卡 */}
      <div className="flex flex-col items-center gap-3 w-full max-w-sm rounded-2xl border-2 border-teal-200 dark:border-teal-900 bg-teal-50 dark:bg-teal-950 shadow-sm px-5 py-6">
        {/* 句子 */}
        <p className="text-lg font-medium text-center leading-relaxed">
          {before}
          <span className={[
            'inline-block min-w-[3rem] mx-1 px-2 rounded border-b-2 text-center transition-colors',
            !selected
              ? 'border-teal-400 dark:border-teal-500 text-teal-400 dark:text-teal-500'
              : selected === current.payload.answer
                ? 'border-green-500 text-green-600 dark:text-green-400'
                : 'border-red-400 text-red-500 dark:text-red-400',
          ].join(' ')}>
            {selected ?? '　　'}
          </span>
          {after}
        </p>

        {/* 中文翻譯（答題後顯示） */}
        <p className={`text-sm text-teal-600 dark:text-teal-300 transition-opacity ${selected ? 'opacity-100' : 'opacity-0'}`}>
          {current.payload.meaning}
        </p>

        {/* 文法說明（答題後顯示） */}
        <p className={`text-xs text-teal-400 dark:text-teal-500 text-center transition-opacity ${selected ? 'opacity-100' : 'opacity-0'}`}>
          {current.payload.grammar}
        </p>
      </div>

      {/* 選項 */}
      <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
        {shuffledChoices.map((choice) => {
          const isCorrect = choice === current.payload.answer
          const isPicked = choice === selected
          let cls = 'rounded-xl border-2 py-3 px-2 text-sm font-medium transition-colors '
          if (!selected) {
            cls += 'border-slate-200 dark:border-slate-700 hover:border-teal-400 dark:hover:border-teal-500 cursor-pointer'
          } else if (isCorrect) {
            cls += 'border-green-500 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300'
          } else if (isPicked) {
            cls += 'border-red-400 bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400'
          } else {
            cls += 'border-slate-200 dark:border-slate-700 opacity-40'
          }
          return (
            <button key={choice} className={cls} onClick={() => pick(choice)}>
              {choice}
            </button>
          )
        })}
      </div>

      {/* 下一題 */}
      <button
        onClick={() => advance(index + 1)}
        disabled={!showNext}
        className={`mt-2 px-6 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium transition-colors ${!showNext ? 'invisible' : ''}`}
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
            autoNext ? 'bg-teal-600' : 'bg-slate-300 dark:bg-slate-600',
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
