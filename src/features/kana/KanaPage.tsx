import { useEffect, useState } from 'react'
import type { KanaChar, KanaType } from './types'
import { loadKana, filterByType } from './data'
import KanaTable from './components/KanaTable'
import FlashCardQuiz from './components/FlashCardQuiz'

type Tab = 'table' | 'quiz'

export default function KanaPage() {
  const [allChars, setAllChars] = useState<KanaChar[]>([])
  const [kanaType, setKanaType] = useState<KanaType>('hiragana')
  const [tab, setTab] = useState<Tab>('table')
  const [showRomaji, setShowRomaji] = useState(true)
  const [quizMode, setQuizMode] = useState<'kana→romaji' | 'romaji→kana'>('kana→romaji')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadKana()
      .then((chars) => { setAllChars(chars); setLoading(false) })
      .catch(() => { setError('資料載入失敗，請重新整理頁面'); setLoading(false) })
  }, [])

  const chars = filterByType(allChars, kanaType).filter((c) => c.group !== 'combo')

  if (loading) return <p className="text-slate-400">載入中⋯</p>
  if (error)   return <p className="text-red-500">{error}</p>

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">五十音</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          平假名與片假名 — 日文的基礎音節表
        </p>
      </header>

      {/* 平假名 / 片假名 切換 */}
      <div className="flex gap-2">
        {(['hiragana', 'katakana'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setKanaType(t)}
            className={[
              'px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
              kanaType === t
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700',
            ].join(' ')}
          >
            {t === 'hiragana' ? '平假名' : '片假名'}
          </button>
        ))}
      </div>

      {/* 分頁 */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex gap-6">
        {[
          { id: 'table' as Tab, label: '對照表' },
          { id: 'quiz'  as Tab, label: '測驗' },
        ].map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={[
              'pb-2 text-sm font-medium border-b-2 -mb-px transition-colors',
              tab === id
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300',
            ].join(' ')}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'table' && (
        <div className="space-y-4">
          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer w-fit">
            <input
              type="checkbox"
              checked={showRomaji}
              onChange={(e) => setShowRomaji(e.target.checked)}
              className="rounded"
            />
            顯示羅馬拼音
          </label>
          <KanaTable chars={chars} showRomaji={showRomaji} />
        </div>
      )}

      {tab === 'quiz' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            {(['kana→romaji', 'romaji→kana'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setQuizMode(m)}
                className={[
                  'px-3 py-1 rounded-full text-xs font-medium transition-colors',
                  quizMode === m
                    ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700',
                ].join(' ')}
              >
                {m === 'kana→romaji' ? '看假名選讀音' : '看讀音選假名'}
              </button>
            ))}
          </div>
          <FlashCardQuiz chars={chars} mode={quizMode} />
        </div>
      )}
    </div>
  )
}
