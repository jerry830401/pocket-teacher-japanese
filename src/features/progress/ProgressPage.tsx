import { useEffect, useState } from 'react'
import { db } from '@/lib/db/db'
import type { SrsCard } from '@/lib/srs/types'

const KANA_TOTAL = { hiragana: 71, katakana: 71 }
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
function mastered(cards: SrsCard[]) { return cards.filter((c) => c.repetitions >= 3).length }
function learned(cards: SrsCard[])  { return cards.filter((c) => c.repetitions >= 1).length }

// ── Pixel progress bar ────────────────────────────────────────────────────────

function PxBar({ value, color = 'var(--color-matcha)' }: { value: number; color?: string }) {
  return (
    <div className="px-bar">
      <span className="px-bar-fill" style={{ width: `${value}%`, background: color }} />
    </div>
  )
}

// ── Module block ──────────────────────────────────────────────────────────────

function ModuleBlock({
  label, seen, mast, total, bg, showSeen = true,
}: {
  label: string; seen: number; mast: number; total: number
  bg: string; showSeen?: boolean
}) {
  return (
    <div className="pcard" style={{ background: bg, padding: '12px 14px' }}>
      <div style={{
        fontFamily: '"Press Start 2P", monospace',
        fontSize: 9,
        lineHeight: 1.4,
        marginBottom: 8,
        color: 'var(--color-ink)',
      }}>
        {label}
      </div>
      {showSeen && (
        <div style={{ marginBottom: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            <span style={{ fontFamily: '"VT323", monospace', fontSize: 14, color: 'var(--color-ink-soft)' }}>
              已學習 {seen} / {total}
            </span>
            <span style={{ fontFamily: '"VT323", monospace', fontSize: 14, color: 'var(--color-ink-soft)' }}>
              {pct(seen, total)}%
            </span>
          </div>
          <PxBar value={pct(seen, total)} color="var(--color-indigo-px)" />
        </div>
      )}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
          <span style={{ fontFamily: '"VT323", monospace', fontSize: 14, color: 'var(--color-ink-soft)' }}>
            已熟悉 {mast} / {total}
          </span>
          <span style={{ fontFamily: '"VT323", monospace', fontSize: 14, color: 'var(--color-ink-soft)' }}>
            {pct(mast, total)}%
          </span>
        </div>
        <PxBar value={pct(mast, total)} color="var(--color-matcha)" />
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ProgressPage() {
  const [loadState, setLoadState] = useState<LoadState>({ status: 'loading' })

  useEffect(() => {
    db.srsCards.toArray()
      .then((all) => setLoadState({ status: 'ok', data: all }))
      .catch(() => setLoadState({ status: 'error' }))
  }, [])

  if (loadState.status === 'loading') return (
    <p style={{ color: 'var(--color-ink-soft)', fontFamily: '"VT323", monospace', fontSize: 20, padding: 16 }}>載入中⋯</p>
  )
  if (loadState.status === 'error') return (
    <p style={{ color: '#c8633a', fontSize: 13, padding: 16 }}>
      無法讀取學習記錄，您的瀏覽器可能不支援本地儲存（如私密模式）。
    </p>
  )

  const all = loadState.data
  const hiraganaCards = all.filter((c) => c.cardId.startsWith('kana-h-'))
  const katakanaCards = all.filter((c) => c.cardId.startsWith('kana-k-'))

  function levelCards(module: string, level: string) {
    return all.filter((c) => c.cardId.startsWith(`${module}-${level}-`))
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '0 16px 16px' }}>
      {/* 頁首 */}
      <div style={{ padding: '14px 0 10px' }}>
        <span style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 11, lineHeight: 1.4 }}>進度</span>
      </div>

      {/* 五十音 */}
      <section style={{ marginBottom: 20 }}>
        <div style={{
          fontFamily: '"Press Start 2P", monospace',
          fontSize: 8,
          color: 'var(--color-ink-soft)',
          marginBottom: 8,
          letterSpacing: 1,
        }}>五十音</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {([
            { label: '平假名', cards: hiraganaCards, total: KANA_TOTAL.hiragana },
            { label: '片假名', cards: katakanaCards, total: KANA_TOTAL.katakana },
          ] as const).map(({ label, cards, total }) => {
            if (cards.length === 0) return null
            return (
              <ModuleBlock
                key={label}
                label={label}
                seen={cards.length}
                mast={mastered(cards)}
                total={total}
                bg="var(--color-indigo-px-soft)"
                showSeen={false}
              />
            )
          })}
          {hiraganaCards.length === 0 && katakanaCards.length === 0 && (
            <p style={{ fontSize: 13, color: 'var(--color-ink-faint)' }}>尚無記錄</p>
          )}
        </div>
      </section>

      {/* 單字 */}
      <section style={{ marginBottom: 20 }}>
        <div style={{
          fontFamily: '"Press Start 2P", monospace',
          fontSize: 8,
          color: 'var(--color-ink-soft)',
          marginBottom: 8,
          letterSpacing: 1,
        }}>單字</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {JLPT_LEVELS.map((level) => {
            const cards = levelCards('vocab', level)
            if (cards.length === 0) return null
            const total = MODULE_TOTALS.vocab[level] ?? cards.length
            return (
              <ModuleBlock
                key={level}
                label={level}
                seen={learned(cards)}
                mast={mastered(cards)}
                total={total}
                bg="var(--color-sakura-soft)"
              />
            )
          })}
          {JLPT_LEVELS.every((l) => levelCards('vocab', l).length === 0) && (
            <p style={{ fontSize: 13, color: 'var(--color-ink-faint)' }}>尚無記錄</p>
          )}
        </div>
      </section>

      {/* 文法 */}
      <section style={{ marginBottom: 20 }}>
        <div style={{
          fontFamily: '"Press Start 2P", monospace',
          fontSize: 8,
          color: 'var(--color-ink-soft)',
          marginBottom: 8,
          letterSpacing: 1,
        }}>文法</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {JLPT_LEVELS.map((level) => {
            const cards = levelCards('grammar', level)
            if (cards.length === 0) return null
            const total = MODULE_TOTALS.grammar[level] ?? cards.length
            return (
              <ModuleBlock
                key={level}
                label={level}
                seen={learned(cards)}
                mast={mastered(cards)}
                total={total}
                bg="var(--color-matcha-soft)"
              />
            )
          })}
          {JLPT_LEVELS.every((l) => levelCards('grammar', l).length === 0) && (
            <p style={{ fontSize: 13, color: 'var(--color-ink-faint)' }}>尚無記錄</p>
          )}
        </div>
      </section>

      {all.length === 0 && (
        <p style={{ fontSize: 13, color: 'var(--color-ink-faint)', textAlign: 'center', padding: '8px 0' }}>
          還沒有練習記錄，去各模組學習後就會顯示統計。
        </p>
      )}
    </div>
  )
}
