import { useEffect, useState } from 'react'
import { db } from '@/lib/db/db'
import type { SrsCard } from '@/lib/srs/types'

// combo (拗音) excluded — matches KanaSection filter
const KANA_TOTAL = { hiragana: 71, katakana: 71 }

// Known total counts per level per module; extend when new levels are added
const MODULE_TOTALS: Record<string, Record<string, number>> = {
  vocab:   { N5: 500 },
  grammar: { N5: 200 },
}

const JLPT_LEVELS = ['N5', 'N4', 'N3', 'N2', 'N1'] as const

type LoadState = { status: 'loading' } | { status: 'ok'; data: SrsCard[] } | { status: 'error' }

function pct(a: number, b: number) {
  if (b === 0) return 0
  return Math.round((a / b) * 100)
}

function mastered(cards: SrsCard[]) {
  return cards.filter((c) => c.repetitions >= 3).length
}

export default function ProgressPage() {
  const [loadState, setLoadState] = useState<LoadState>({ status: 'loading' })

  useEffect(() => {
    db.srsCards.toArray()
      .then((all) => setLoadState({ status: 'ok', data: all }))
      .catch(() => setLoadState({ status: 'error' }))
  }, [])

  if (loadState.status === 'loading') return <p className="text-slate-400">載入中⋯</p>
  if (loadState.status === 'error') return <p className="text-red-500">無法讀取學習記錄，您的瀏覽器可能不支援本地儲存（如私密模式）。</p>

  const all = loadState.data
  const due = all.filter((c) => c.dueAt <= Date.now()).length

  const reviewedDays = new Set(
    all
      .filter((c) => c.lastReviewedAt > 0)
      .map((c) => new Date(c.lastReviewedAt).toDateString()),
  )
  const streak = calcStreak(reviewedDays)

  // 假名
  const hiraganaCards = all.filter((c) => c.cardId.startsWith('kana-h-'))
  const katakanaCards = all.filter((c) => c.cardId.startsWith('kana-k-'))

  // 單字＆文法：依難度分組
  function levelCards(module: string, level: string) {
    return all.filter((c) => c.cardId.startsWith(`${module}-${level}-`))
  }

  return (
    <div className="h-full overflow-y-auto pb-20 md:pb-6">
      <div className="pt-4 space-y-6">
        <header className="pr-10 md:pr-0">
          <h1 className="text-xl font-semibold tracking-tight">進度</h1>
        </header>

        {/* 總覽 */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="待複習" value={due} unit="張" highlight={due > 0} />
          <StatCard label="已學習" value={all.length} unit="張" />
          <StatCard label="連續學習" value={streak} unit="天" />
        </div>

        {/* 五十音 */}
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-slate-500 dark:text-slate-400">五十音</h2>
          {(
            [
              { label: '平假名', cards: hiraganaCards, total: KANA_TOTAL.hiragana },
              { label: '片假名', cards: katakanaCards, total: KANA_TOTAL.katakana },
            ] as const
          ).map(({ label, cards, total }) => {
            if (cards.length === 0) return null
            return (
              <ModuleBlock
                key={label}
                label={label}
                seen={cards.length}
                mast={mastered(cards)}
                total={total}
                color="text-indigo-600 dark:text-indigo-400"
                bg="bg-indigo-50 dark:bg-indigo-950"
                border="border-indigo-200 dark:border-indigo-800"
              />
            )
          })}
          {hiraganaCards.length === 0 && katakanaCards.length === 0 && (
            <EmptyHint />
          )}
        </section>

        {/* 單字 */}
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-slate-500 dark:text-slate-400">單字</h2>
          {JLPT_LEVELS.map((level) => {
            const cards = levelCards('vocab', level)
            if (cards.length === 0) return null
            const total = MODULE_TOTALS.vocab[level] ?? cards.length
            return (
              <ModuleBlock
                key={level}
                label={level}
                seen={cards.length}
                mast={mastered(cards)}
                total={total}
                color="text-indigo-600 dark:text-indigo-400"
                bg="bg-indigo-50 dark:bg-indigo-950"
                border="border-indigo-200 dark:border-indigo-800"
              />
            )
          })}
          {JLPT_LEVELS.every((l) => levelCards('vocab', l).length === 0) && <EmptyHint />}
        </section>

        {/* 文法 */}
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-slate-500 dark:text-slate-400">文法</h2>
          {JLPT_LEVELS.map((level) => {
            const cards = levelCards('grammar', level)
            if (cards.length === 0) return null
            const total = MODULE_TOTALS.grammar[level] ?? cards.length
            return (
              <ModuleBlock
                key={level}
                label={level}
                seen={cards.length}
                mast={mastered(cards)}
                total={total}
                color="text-teal-600 dark:text-teal-400"
                bg="bg-teal-50 dark:bg-teal-950"
                border="border-teal-200 dark:border-teal-800"
              />
            )
          })}
          {JLPT_LEVELS.every((l) => levelCards('grammar', l).length === 0) && <EmptyHint />}
        </section>

        {all.length === 0 && (
          <p className="text-sm text-slate-400 py-2 text-center">還沒有練習記錄，去各模組學習後就會顯示統計。</p>
        )}
      </div>
    </div>
  )
}

function ModuleBlock({
  label, seen, mast, total, color, bg, border,
}: {
  label: string; seen: number; mast: number; total: number
  color: string; bg: string; border: string
}) {
  return (
    <div className={`rounded-xl border ${border} ${bg} px-4 py-3 space-y-2`}>
      <span className={`text-sm font-medium ${color}`}>{label}</span>
      <ProgressBar value={pct(seen, total)} label={`已學習 ${seen} / ${total}`} color="bg-slate-400 dark:bg-slate-500" />
      <ProgressBar value={pct(mast, total)} label={`已熟悉 ${mast} / ${total}`} color="bg-green-500" />
    </div>
  )
}

function EmptyHint() {
  return <p className="text-sm text-slate-400">尚無記錄</p>
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
  const today = new Date()
  const startOffset = reviewedDays.has(today.toDateString()) ? 0 : 1
  let streak = 0
  for (let i = startOffset; i < 365; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    if (reviewedDays.has(d.toDateString())) streak++
    else break
  }
  return streak
}
