import { useEffect, useState } from 'react'
import { db } from '@/lib/db/db'
import type { SrsCard } from '@/lib/srs/types'

interface ModuleStat {
  label: string
  prefix: string
  color: string
  bg: string
  border: string
}

const MODULES: ModuleStat[] = [
  { label: '五十音', prefix: 'kana-',      color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-950', border: 'border-indigo-200 dark:border-indigo-800' },
  { label: '單字',   prefix: 'vocab-',     color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-950', border: 'border-indigo-200 dark:border-indigo-800' },
  { label: '文法',   prefix: 'grammar-',   color: 'text-teal-600 dark:text-teal-400',     bg: 'bg-teal-50 dark:bg-teal-950',     border: 'border-teal-200 dark:border-teal-800' },
  { label: '聽力',   prefix: 'vocab-',     color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-950', border: 'border-orange-200 dark:border-orange-800' },
]

interface Stats {
  all: SrsCard[]
  due: SrsCard[]
}

function pct(a: number, b: number) {
  if (b === 0) return 0
  return Math.round((a / b) * 100)
}

function moduleCards(all: SrsCard[], prefix: string) {
  return all.filter((c) => c.cardId.startsWith(prefix))
}

// 答過至少一次的牌（repetitions > 0）
function reviewed(cards: SrsCard[]) {
  return cards.filter((c) => c.repetitions > 0)
}

// 熟悉度：repetitions >= 3 視為「已熟悉」
function mastered(cards: SrsCard[]) {
  return cards.filter((c) => c.repetitions >= 3)
}

export default function ProgressPage() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    async function load() {
      const all = await db.srsCards.toArray()
      const due = await db.srsCards.where('dueAt').belowOrEqual(Date.now()).toArray()
      setStats({ all, due })
    }
    load()
  }, [])

  if (!stats) return <p className="text-slate-400">載入中⋯</p>

  const { all, due } = stats
  const totalReviewed = reviewed(all).length

  // 連續學習天數：看 lastReviewedAt 往回數連續有記錄的天數
  const reviewedDays = new Set(
    all
      .filter((c) => c.lastReviewedAt > 0)
      .map((c) => new Date(c.lastReviewedAt).toDateString()),
  )
  const streak = calcStreak(reviewedDays)

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">進度</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">學習統計與 SRS 複習狀態</p>
      </header>

      {/* 總覽 */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="待複習" value={due.length} unit="張" highlight={due.length > 0} />
        <StatCard label="已練習" value={totalReviewed} unit="張" />
        <StatCard label="連續學習" value={streak} unit="天" />
      </div>

      {/* 各模組 */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-slate-500 dark:text-slate-400">各模組</h2>
        {MODULES.map((m) => {
          const cards = moduleCards(all, m.prefix)
          const rev = reviewed(cards).length
          const mast = mastered(cards).length
          const dueCount = due.filter((c) => c.cardId.startsWith(m.prefix)).length
          if (cards.length === 0) return null
          return (
            <div key={m.label + m.prefix} className={`rounded-xl border ${m.border} ${m.bg} px-4 py-3 space-y-2`}>
              <div className="flex items-center justify-between">
                <span className={`text-sm font-medium ${m.color}`}>{m.label}</span>
                <span className="text-xs text-slate-400">{dueCount > 0 ? `${dueCount} 張待複習` : '無待複習'}</span>
              </div>
              <ProgressBar value={pct(rev, cards.length)} label={`已練習 ${rev} / ${cards.length}`} color="bg-slate-400 dark:bg-slate-500" />
              <ProgressBar value={pct(mast, cards.length)} label={`已熟悉 ${mast} / ${cards.length}`} color="bg-green-500" />
            </div>
          )
        })}
        {all.length === 0 && (
          <p className="text-sm text-slate-400 py-4 text-center">還沒有練習記錄，去各模組答題後就會顯示統計。</p>
        )}
      </section>
    </div>
  )
}

function StatCard({ label, value, unit, highlight = false }: { label: string; value: number; unit: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border px-3 py-3 text-center ${highlight ? 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950' : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900'}`}>
      <p className={`text-2xl font-semibold ${highlight ? 'text-amber-600 dark:text-amber-400' : 'text-slate-700 dark:text-slate-200'}`}>{value}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{unit}　{label}</p>
    </div>
  )
}

function ProgressBar({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-slate-400">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-700">
        <div className={`h-1.5 rounded-full transition-all ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}

function calcStreak(reviewedDays: Set<string>): number {
  if (reviewedDays.size === 0) return 0
  let streak = 0
  const today = new Date()
  for (let i = 0; i < 365; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    if (reviewedDays.has(d.toDateString())) {
      streak++
    } else {
      break
    }
  }
  return streak
}
