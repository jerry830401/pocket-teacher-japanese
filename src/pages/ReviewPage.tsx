import { useEffect, useState } from 'react'
import { db } from '@/lib/db/db'
import type { SrsCard } from '@/lib/srs/types'
import type { VocabCard } from '@/features/vocabulary/types'
import type { GrammarCard } from '@/features/grammar/types'
import type { KanaChar } from '@/features/kana/types'
import { loadVocabulary } from '@/features/vocabulary/data'
import { loadGrammar } from '@/features/grammar/data'
import { loadKana } from '@/features/kana/data'
import VocabQuiz from '@/features/vocabulary/components/VocabQuiz'
import GrammarQuiz from '@/features/grammar/components/GrammarQuiz'
import FlashCardQuiz from '@/features/kana/components/FlashCardQuiz'

function isWeak(card: SrsCard) {
  return card.easeFactor < 2.5 && card.repetitions < 3
}

type Subject = 'kana' | 'vocab' | 'grammar'

type PageState =
  | { status: 'loading' }
  | { status: 'ready'; weakIds: Record<Subject, string[]> }
  | { status: 'error' }

type ReviewState =
  | { status: 'idle' }
  | { status: 'loading'; subject: Subject }
  | { status: 'ready'; subject: 'vocab'; cards: VocabCard[] }
  | { status: 'ready'; subject: 'grammar'; cards: GrammarCard[] }
  | { status: 'ready'; subject: 'kana'; chars: KanaChar[] }
  | { status: 'error' }

const SUBJECT_META: Record<Subject, { label: string; bg: string }> = {
  kana:    { label: '五十音', bg: 'var(--color-indigo-px-soft)' },
  vocab:   { label: '單字',   bg: 'var(--color-sakura-soft)' },
  grammar: { label: '文法',   bg: 'var(--color-matcha-soft)' },
}

export default function ReviewPage() {
  const [pageState, setPageState] = useState<PageState>({ status: 'loading' })
  const [reviewState, setReviewState] = useState<ReviewState>({ status: 'idle' })

  useEffect(() => {
    db.srsCards.toArray()
      .then((all) => {
        const weak = all.filter(isWeak)
        setPageState({
          status: 'ready',
          weakIds: {
            kana:    weak.filter((c) => c.cardId.startsWith('kana-')).map((c) => c.cardId),
            vocab:   weak.filter((c) => c.cardId.startsWith('vocab-')).map((c) => c.cardId),
            grammar: weak.filter((c) => c.cardId.startsWith('grammar-')).map((c) => c.cardId),
          },
        })
      })
      .catch(() => setPageState({ status: 'error' }))
  }, [])

  async function startReview(subject: Subject, ids: string[]) {
    setReviewState({ status: 'loading', subject })
    try {
      const idSet = new Set(ids)
      if (subject === 'vocab') {
        const all = await loadVocabulary()
        setReviewState({ status: 'ready', subject: 'vocab', cards: all.filter((c) => idSet.has(c.id)) })
      } else if (subject === 'grammar') {
        const all = await loadGrammar()
        setReviewState({ status: 'ready', subject: 'grammar', cards: all.filter((c) => idSet.has(c.id)) })
      } else {
        const all = await loadKana()
        const rawIds = new Set(ids.map((id) => id.replace(/^kana-/, '')))
        setReviewState({ status: 'ready', subject: 'kana', chars: all.filter((c) => rawIds.has(c.id)) })
      }
    } catch {
      setReviewState({ status: 'error' })
    }
  }

  if (reviewState.status === 'loading') {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--color-ink-soft)', fontFamily: '"VT323", monospace', fontSize: 20 }}>載入中⋯</p>
      </div>
    )
  }
  if (reviewState.status === 'error') {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#c8633a', fontSize: 13 }}>資料載入失敗，請重新整理頁面</p>
      </div>
    )
  }

  if (reviewState.status === 'ready') {
    const meta = SUBJECT_META[reviewState.subject]
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* 頁首 */}
        <div style={{ flexShrink: 0, padding: '14px 16px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 9, color: 'var(--color-ink-soft)', flex: 1 }}>
            {meta.label}複習
          </span>
          <button className="pbtn pbtn-ghost" style={{ padding: '4px 10px', fontSize: 13, flexShrink: 0 }}
            onClick={() => setReviewState({ status: 'idle' })}>
            ← 返回
          </button>
        </div>

        <div style={{ flex: 1, minHeight: 0, padding: '0 16px 8px' }}>
          {reviewState.subject === 'vocab' && (() => {
            if (reviewState.cards.length < 4) return (
              <div className="pcard" style={{ background: 'var(--color-sakura-soft)' }}>
                <p style={{ margin: 0, fontSize: 14 }}>錯題不足 4 張，多練幾輪後再回來！</p>
              </div>
            )
            return <VocabQuiz cards={reviewState.cards} />
          })()}
          {reviewState.subject === 'grammar' && (() => {
            if (reviewState.cards.length < 4) return (
              <div className="pcard" style={{ background: 'var(--color-sakura-soft)' }}>
                <p style={{ margin: 0, fontSize: 14 }}>錯題不足 4 張，多練幾輪後再回來！</p>
              </div>
            )
            return <GrammarQuiz cards={reviewState.cards} />
          })()}
          {reviewState.subject === 'kana' && (() => {
            if (reviewState.chars.length < 4) return (
              <div className="pcard" style={{ background: 'var(--color-sakura-soft)' }}>
                <p style={{ margin: 0, fontSize: 14 }}>錯題不足 4 張，多練幾輪後再回來！</p>
              </div>
            )
            return <FlashCardQuiz chars={reviewState.chars} mode="kana→romaji" />
          })()}
        </div>
      </div>
    )
  }

  // ── 錯題列表（idle） ──
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flexShrink: 0, padding: '14px 16px 10px' }}>
        <span style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 11, lineHeight: 1.4 }}>錯題本</span>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '0 16px 8px' }}>
        {pageState.status === 'loading' && (
          <p style={{ color: 'var(--color-ink-soft)', fontFamily: '"VT323", monospace', fontSize: 20 }}>載入中⋯</p>
        )}
        {pageState.status === 'error' && (
          <p style={{ color: '#c8633a', fontSize: 13 }}>無法讀取學習記錄</p>
        )}
        {pageState.status === 'ready' && (() => {
          const { weakIds } = pageState
          const total = weakIds.kana.length + weakIds.vocab.length + weakIds.grammar.length

          if (total === 0) {
            return (
              <div className="pcard" style={{
                background: 'var(--color-matcha-soft)',
                textAlign: 'center',
                padding: '32px 16px',
              }}>
                <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 10, lineHeight: 1.6, marginBottom: 8 }}>
                  全部答對！
                </div>
                <p style={{ margin: 0, fontSize: 14, color: 'var(--color-ink-soft)' }}>目前沒有錯題，繼續保持！</p>
              </div>
            )
          }

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(['kana', 'vocab', 'grammar'] as const).map((subject) => {
                const count = weakIds[subject].length
                if (count === 0) return null
                const meta = SUBJECT_META[subject]
                return (
                  <div key={subject} className="pcard" style={{ background: meta.bg }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 10, lineHeight: 1.4 }}>
                          {meta.label}
                        </div>
                        <div style={{ fontFamily: '"VT323", monospace', fontSize: 18, color: 'var(--color-ink-soft)', marginTop: 2 }}>
                          {count} 張待加強
                        </div>
                      </div>
                      <button
                        className="pbtn pbtn-primary"
                        style={{ padding: '8px 14px', fontSize: 13 }}
                        onClick={() => startReview(subject, weakIds[subject])}
                      >
                        ▶ 開始複習
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })()}
      </div>
    </div>
  )
}
