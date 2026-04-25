import { useEffect, useState } from 'react'
import type { GrammarCard, JlptLevel } from './types'
import { loadGrammar, filterByLevel } from './data'
import GrammarQuiz from './components/GrammarQuiz'

const LEVELS: JlptLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1']

export default function GrammarPage() {
  const [allCards, setAllCards] = useState<GrammarCard[]>([])
  const [level, setLevel] = useState<JlptLevel>('N5')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadGrammar()
      .then((data) => { setAllCards(data); setLoading(false) })
      .catch(() => { setError('資料載入失敗'); setLoading(false) })
  }, [])

  if (loading) return <p className="text-slate-400">載入中⋯</p>
  if (error)   return <p className="text-red-500">{error}</p>

  const cards = filterByLevel(allCards, level)

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">文法</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          JLPT 分級文法填空測驗
        </p>
      </header>

      {/* 等級切換 */}
      <div className="flex gap-2 flex-wrap">
        {LEVELS.map((l) => {
          const count = allCards.filter((c) => c.level === l).length
          const available = count > 0
          return (
            <button
              key={l}
              onClick={() => available && setLevel(l)}
              disabled={!available}
              className={[
                'px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
                level === l
                  ? 'bg-teal-600 text-white'
                  : available
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 cursor-not-allowed',
              ].join(' ')}
            >
              {l}
              {available && <span className="ml-1 text-xs opacity-60">{count}</span>}
            </button>
          )
        })}
      </div>

      {cards.length >= 4 ? (
        <GrammarQuiz cards={cards} />
      ) : (
        <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-700 p-6 text-sm text-slate-500">
          {level} 文法資料尚未加入，敬請期待。
        </div>
      )}
    </div>
  )
}
