import { useReducer, useEffect, useMemo } from 'react'
import type { GrammarCard } from '../types'
import { getOrCreateCard, saveCard } from '@/lib/db/db'
import { review } from '@/lib/srs/sm2'
import { useSettings } from '@/stores/useSettings'


interface Props {
  cards: GrammarCard[]
}

interface QuizState {
  deck: GrammarCard[]
  index: number
  selected: string | null
  correct: number
  roundDone: boolean
}

type QuizAction =
  | { type: 'START'; deck: GrammarCard[] }
  | { type: 'PICK'; choiceId: string; isCorrect: boolean }
  | { type: 'NEXT'; index: number }
  | { type: 'DONE' }

function reducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case 'START':
      return { deck: action.deck, index: 0, selected: null, correct: 0, roundDone: false }
    case 'PICK':
      return { ...state, selected: action.choiceId, correct: state.correct + (action.isCorrect ? 1 : 0) }
    case 'NEXT':
      return { ...state, index: action.index, selected: null }
    case 'DONE':
      return { ...state, roundDone: true }
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

function buildRound(cards: GrammarCard[], size: number): GrammarCard[] {
  return shuffle(cards).slice(0, size)
}

function splitSentence(sentence: string): [string, string] {
  const idx = sentence.indexOf('___')
  if (idx === -1) return [sentence, '']
  return [sentence.slice(0, idx), sentence.slice(idx + 3)]
}

export default function GrammarQuiz({ cards }: Props) {
  const autoNext = useSettings((s) => s.autoNextGrammar)
  const roundSize = useSettings((s) => s.roundSizeGrammar)
  const [state, dispatch] = useReducer(reducer, undefined, () => ({
    deck: buildRound(cards, roundSize),
    index: 0,
    selected: null,
    correct: 0,
    roundDone: false,
  }))

  useEffect(() => {
    dispatch({ type: 'START', deck: buildRound(cards, roundSize) })
  }, [cards, roundSize])

  const { deck, index, selected, correct, roundDone } = state
  const current = deck[index]

  const shuffledChoices = useMemo(
    () => (current ? shuffle(current.payload.choices) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [current?.id],
  )

  function startNextRound() {
    dispatch({ type: 'START', deck: buildRound(cards, roundSize) })
  }

  function advance(nextIndex: number) {
    if (nextIndex >= deck.length) {
      dispatch({ type: 'DONE' })
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

  if (roundDone) {
    const pct = Math.round((correct / deck.length) * 100)
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4">
        <span className="text-5xl font-bold text-teal-600 dark:text-teal-400">{pct}%</span>
        <span className="text-slate-500 text-sm">{deck.length} 題中答對 {correct} 題</span>
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
          下一輪（{roundSize} 題）
        </button>
      </div>
    )
  }

  if (!current) return null

  const [before, after] = splitSentence(current.payload.sentence)
  const isLastQuestion = index === deck.length - 1
  const showNext = selected !== null && !(autoNext && selected === current.payload.answer)

  return (
    <div className="h-full flex flex-col justify-between py-2">
      {/* 進度區 */}
      <div className="shrink-0 space-y-2">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <span>第 {index + 1} / {deck.length} 題</span>
          <span className="text-slate-300 dark:text-slate-600">·</span>
          <span>正確 {correct}</span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
          <div
            className="h-full rounded-full bg-teal-500 transition-all duration-300"
            style={{ width: `${((index + (selected ? 1 : 0)) / deck.length) * 100}%` }}
          />
        </div>
      </div>

      {/* 題目卡 */}
      <div className="flex-1 min-h-0 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2 w-full max-w-sm rounded-2xl border-2 border-teal-200 dark:border-teal-900 bg-teal-50 dark:bg-teal-950 shadow-sm px-4 py-4">
          <p className="text-base font-medium text-center leading-relaxed">
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
          <p className={`text-sm text-teal-600 dark:text-teal-300 transition-opacity ${selected ? 'opacity-100' : 'opacity-0'}`}>
            {current.payload.meaning}
          </p>
          <p className={`text-xs text-teal-400 dark:text-teal-500 text-center transition-opacity ${selected ? 'opacity-100' : 'opacity-0'}`}>
            {current.payload.grammar}
          </p>
        </div>
      </div>

      {/* 選項 + 下一題 */}
      <div className="shrink-0 flex flex-col items-center gap-8 pb-4">
        <div className="grid grid-cols-2 gap-2.5 w-full max-w-xs">
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

        <button
          onClick={() => advance(index + 1)}
          disabled={!showNext}
          className={`px-8 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium transition-colors ${!showNext ? 'invisible' : ''}`}
        >
          {isLastQuestion ? '查看結果' : '下一題'}
        </button>
      </div>
    </div>
  )
}
