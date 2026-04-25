import { useState, useCallback, useEffect } from 'react'
import type { KanaChar } from '../types'

type Mode = 'kana→romaji' | 'romaji→kana'

interface Props {
  chars: KanaChar[]
  mode: Mode
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function buildChoices(correct: KanaChar, pool: KanaChar[], _mode: Mode): KanaChar[] {
  const others = pool.filter((c) => c.id !== correct.id)
  const wrong = shuffle(others).slice(0, 3)
  return shuffle([correct, ...wrong])
}

export default function FlashCardQuiz({ chars, mode }: Props) {
  const [deck, setDeck] = useState<KanaChar[]>([])
  const [index, setIndex] = useState(0)
  const [choices, setChoices] = useState<KanaChar[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [correct, setCorrect] = useState(0)
  const [total, setTotal] = useState(0)

  const start = useCallback(() => {
    const shuffled = shuffle(chars)
    setDeck(shuffled)
    setIndex(0)
    setSelected(null)
    setCorrect(0)
    setTotal(0)
    setChoices(buildChoices(shuffled[0], chars, mode))
  }, [chars, mode])

  useEffect(() => { start() }, [start])

  const current = deck[index]

  function pick(choice: KanaChar) {
    if (selected) return
    setSelected(choice.id)
    setTotal((t) => t + 1)
    if (choice.id === current.id) setCorrect((c) => c + 1)
  }

  function next() {
    const nextIndex = index + 1
    if (nextIndex >= deck.length) {
      start()
      return
    }
    setIndex(nextIndex)
    setSelected(null)
    setChoices(buildChoices(deck[nextIndex], chars, mode))
  }

  if (!current) return null

  const isFinished = index === deck.length - 1 && selected !== null
  const prompt = mode === 'kana→romaji' ? current.kana : current.romaji
  const answerKey = (c: KanaChar) => mode === 'kana→romaji' ? c.romaji : c.kana

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
          let cls =
            'rounded-xl border-2 py-3 text-lg font-medium transition-colors '
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
        onClick={next}
        disabled={!selected}
        className={`mt-2 px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors ${!selected ? 'invisible' : ''}`}
      >
        {isFinished ? '重新開始' : '下一題'}
      </button>
    </div>
  )
}
