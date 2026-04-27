import { useReducer, useState, useEffect, useRef } from 'react'
import type { VocabCard } from '../types'
import { getOrCreateCard, saveCard } from '@/lib/db/db'
import { review } from '@/lib/srs/sm2'
import { useSettings } from '@/stores/useSettings'


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

function buildRound(cards: VocabCard[], size: number): { deck: VocabCard[]; choices: VocabCard[] } {
  const deck = shuffle(cards).slice(0, size)
  return { deck, choices: buildChoices(deck[0], cards) }
}

const POS_LABEL: Record<string, string> = {
  noun: '名詞', verb: '動詞', 'i-adj': 'い形', 'na-adj': 'な形',
  adverb: '副詞', particle: '助詞', expression: '表現', other: '其他',
}

export default function VocabQuiz({ cards }: Props) {
  const autoNext = useSettings((s) => s.autoNextVocab)
  const roundSize = useSettings((s) => s.roundSizeVocab)
  const initialRound = useRef(buildRound(cards, roundSize))
  const [state, dispatch] = useReducer(reducer, {
    deck: initialRound.current.deck,
    index: 0,
    choices: initialRound.current.choices,
    selected: null,
    correct: 0,
  })
  const [roundDone, setRoundDone] = useState(false)

  useEffect(() => {
    const round = buildRound(cards, roundSize)
    dispatch({ type: 'START', deck: round.deck, choices: round.choices })
    setRoundDone(false)
  }, [cards, roundSize])

  const { deck, index, choices, selected, correct } = state
  const current = deck[index]

  function startNextRound() {
    const round = buildRound(cards, roundSize)
    dispatch({ type: 'START', deck: round.deck, choices: round.choices })
    setRoundDone(false)
  }

  function advance(nextIndex: number) {
    if (nextIndex >= deck.length) {
      setRoundDone(true)
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

  if (roundDone) {
    const pct = Math.round((correct / deck.length) * 100)
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4">
        <span className="text-5xl font-bold text-indigo-600 dark:text-indigo-400">{pct}%</span>
        <span className="text-slate-500 text-sm">{deck.length} 題中答對 {correct} 題</span>
        <div className="w-full max-w-xs rounded-2xl border border-slate-200 dark:border-slate-700 p-4 text-sm text-slate-500 text-center">
          {pct === 100 && '完美！全部答對 🎉'}
          {pct >= 80 && pct < 100 && '答得很好，再接再厲！'}
          {pct >= 60 && pct < 80 && '還不錯，繼續練習！'}
          {pct < 60 && '多練幾輪，加油！'}
        </div>
        <button
          onClick={startNextRound}
          className="px-8 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors"
        >
          下一輪（{roundSize} 題）
        </button>
      </div>
    )
  }

  if (!current) return null

  const isLastQuestion = index === deck.length - 1
  const showNext = selected !== null && !(autoNext && selected === current.id)

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
            className="h-full rounded-full bg-indigo-500 transition-all duration-300"
            style={{ width: `${((index + (selected ? 1 : 0)) / deck.length) * 100}%` }}
          />
        </div>
      </div>

      {/* 題目卡 */}
      <div className="flex-1 min-h-0 flex items-center justify-center">
        <div className="flex flex-col items-center justify-center w-56 min-h-28 gap-2 rounded-2xl border-2 border-indigo-200 dark:border-indigo-900 bg-indigo-50 dark:bg-indigo-950 shadow-sm px-4 py-4">
          <span className="text-4xl font-medium">{current.payload.word}</span>
          <span className="text-base text-indigo-400 dark:text-indigo-300">{current.payload.reading}</span>
          <span className="text-xs text-indigo-300 dark:text-indigo-500">
            {POS_LABEL[current.payload.pos] ?? current.payload.pos}
          </span>
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
                {choice.payload.meaning}
              </button>
            )
          })}
        </div>

        <button
          onClick={() => advance(index + 1)}
          disabled={!showNext}
          className={`px-8 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors ${!showNext ? 'invisible' : ''}`}
        >
          {isLastQuestion ? '查看結果' : '下一題'}
        </button>
      </div>
    </div>
  )
}
