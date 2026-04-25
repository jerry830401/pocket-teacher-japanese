import { useEffect, useState } from 'react'
import type { VocabCard } from '@/features/vocabulary/types'
import type { JlptLevel } from './types'
import { loadVocabulary, filterByLevel } from '@/features/vocabulary/data'
import { isSupported } from '@/lib/tts/tts'
import ListeningQuiz from './components/ListeningQuiz'

const LEVELS: JlptLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1']

export default function ListeningPage() {
  const [allCards, setAllCards] = useState<VocabCard[]>([])
  const [level, setLevel] = useState<JlptLevel>('N5')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadVocabulary()
      .then((data) => { setAllCards(data); setLoading(false) })
      .catch(() => { setError('資料載入失敗'); setLoading(false) })
  }, [])

  if (loading) return <p className="text-slate-400">載入中⋯</p>
  if (error)   return <p className="text-red-500">{error}</p>

  if (!isSupported()) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-700 p-6 text-sm text-slate-500">
        您的瀏覽器不支援語音合成（Web Speech API），請使用 Chrome 或 Safari。
      </div>
    )
  }

  const cards = filterByLevel(allCards, level)

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">聽力</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          聽發音，選出正確的單字
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
                  ? 'bg-orange-500 text-white'
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
        <ListeningQuiz cards={cards} />
      ) : (
        <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-700 p-6 text-sm text-slate-500">
          {level} 單字資料尚未加入，敬請期待。
        </div>
      )}
    </div>
  )
}
