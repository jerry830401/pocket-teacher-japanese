import { useReducer, useState, useEffect, useRef, useMemo } from 'react'
import type { GrammarCard } from '../types'
import { getOrCreateCard, saveCard } from '@/lib/db/db'
import { review } from '@/lib/srs/sm2'

const ROUND_SIZE = 20

interface Props {
  cards: GrammarCard[]
}

interface QuizState {
  deck: GrammarCard[]
  index: number
  selected: string | null
  correct: number
}

type QuizAction =
  | { type: 'START'; deck: GrammarCard[] }
  | { type: 'PICK'; choiceId: string; isCorrect: boolean }
  | { type: 'NEXT'; index: number }

function reducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case 'START':
      return { deck: action.deck, index: 0, selected: null, correct: 0 }
    case 'PICK':
      return { ...state, selected: action.choiceId, correct: state.correct + (action.isCorrect ? 1 : 0) }
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

function buildRound(cards: GrammarCard[]): GrammarCard[] {
  return shuffle(cards).slice(0, ROUND_SIZE)
}

// 把 ___ 切成前後兩段，方便渲染空格
function splitSentence(sentence: string): [string, string] {
  const idx = sentence.indexOf('___')
  if (idx === -1) return [sentence, '']
  return [sentence.slice(0, idx), sentence.slice(idx + 3)]
}

export default function GrammarQuiz({ cards }: Props) {
  const initialDeck = useRef(buildRound(cards))
  const [state, dispatch] = useReducer(reducer, {
    deck: initialDeck.current,
    index: 0,
    selected: null,
    correct: 0,
  })
  const [autoNext, setAutoNext] = useState(false)
  const [roundResult, setRoundResult] = useState<{ correct: number } | null>(null)

  useEffect(() => {
    dispatch({ type: 'START', deck: buildRound(cards) })
    setRoundResult(null)
  }, [cards])

  const { deck, index, selected, correct } = state
  const current = deck[index]

  function startNextRound() {
    dispatch({ type: 'START', deck: buildRound(cards) })
    setRoundResult(null)
  }

  function advance(nextIndex: number, finalCorrect = state.correct) {
    if (nextIndex >= deck.length) {
      setRoundResult({ correct: finalCorrect })
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
      const next = correct + 1
      setTimeout(() => advance(index + 1, next), 400)
    }
  }

  // Round summary screen
  if (roundResult !== null) {
    const pct = Math.round((roundResult.correct / deck.length) * 100)
    return (
      <div className="flex flex-col items-center gap-6 py-4">
        <div className="flex flex-col items-center gap-1">
          <span className="text-5xl font-bold text-teal-600 dark:text-teal-400">{pct}%</span>
          <span className="text-slate-500 text-sm">
            {deck.length} 題中答對 {roundResult.correct} 題
          </span>
        </div>
        <div className="w-full max-w-xs rounded-2xl border border-slate-200 dark:border-slate-700 p-4 text-sm text-slate-500 text-center">
          {pct === 100 && '完美！全部答對 🎉'}
          {pct >= 80 && pct < 100 && '答得很好，再接再厲！'}
          {pct >= 60 && pct < 80 && '還不錯，繼續練習！'}
          {pct < 60 && '多練幾輪，加油！'}
        </div>
        <button
          onClick={startNextRound}
          className="px-8 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium transition-colors"
        >
          下一輪（{ROUND_SIZE} 題）
        </button>
      </div>
    )
  }

  if (!current) return null

  const [before, after] = splitSentence(current.payload.sentence)
  const shuffledChoices = useMemo(
    () => shuffle(current.payload.choices),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [current.id],
  )
  const isLastQuestion = index === deck.length - 1
  const showNext = selected !== null && !(autoNext && selected === current.payload.answer)

  return (
    <div className="flex flex-col items-center gap-6">
      {/* 進度 */}
      <div className="flex items-center gap-3 text-sm text-slate-500">
        <span>第 {index + 1} / {deck.length} 題</span>
        <span className="text-slate-300 dark:text-slate-600">·</span>
        <span>正確 {correct}</span>
      </div>

      {/* 進度條 */}
      <div className="w-full max-w-sm h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
        <div
          className="h-full rounded-full bg-teal-500 transition-all duration-300"
          style={{ width: `${((index + (selected ? 1 : 0)) / deck.length) * 100}%` }}
        />
      </div>

      {/* 題目卡 */}
      <div className="flex flex-col items-center gap-3 w-full max-w-sm rounded-2xl border-2 border-teal-200 dark:border-teal-900 bg-teal-50 dark:bg-teal-950 shadow-sm px-5 py-6">
        {/* 句子 */}
        <p className="text-lg font-medium text-center leading-relaxed">
          {before}
          <span className={[
            'inline-block min-w-12 mx-1 px-2 rounded border-b-2 text-center transition-colors',
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
        {isLastQuestion ? '查看結果' : '下一題'}
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
