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

// 曾答錯且尚未熟悉的卡片
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

const SUBJECT_META: Record<Subject, { label: string; color: string; bg: string; border: string; btnColor: string }> = {
  kana:    { label: '五十音', color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-950', border: 'border-indigo-200 dark:border-indigo-800', btnColor: 'bg-indigo-600 hover:bg-indigo-700' },
  vocab:   { label: '單字',   color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-950', border: 'border-indigo-200 dark:border-indigo-800', btnColor: 'bg-indigo-600 hover:bg-indigo-700' },
  grammar: { label: '文法',   color: 'text-teal-600 dark:text-teal-400',     bg: 'bg-teal-50 dark:bg-teal-950',     border: 'border-teal-200 dark:border-teal-800',     btnColor: 'bg-teal-600 hover:bg-teal-700' },
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
        const cards = all.filter((c) => idSet.has(c.id))
        setReviewState({ status: 'ready', subject: 'vocab', cards })
      } else if (subject === 'grammar') {
        const all = await loadGrammar()
        const cards = all.filter((c) => idSet.has(c.id))
        setReviewState({ status: 'ready', subject: 'grammar', cards })
      } else {
        const all = await loadKana()
        // kana cardId format: "kana-h-a" → strip "kana-" to match KanaChar.id
        const rawIds = new Set(ids.map((id) => id.replace(/^kana-/, '')))
        const chars = all.filter((c) => rawIds.has(c.id))
        setReviewState({ status: 'ready', subject: 'kana', chars })
      }
    } catch {
      setReviewState({ status: 'error' })
    }
  }

  // ── 複習中畫面 ──
  if (reviewState.status === 'loading') {
    return <p className="text-slate-400 py-10 text-center">載入中⋯</p>
  }
  if (reviewState.status === 'error') {
    return <p className="text-red-500 text-sm">資料載入失敗，請重新整理頁面</p>
  }
  if (reviewState.status === 'ready') {
    const meta = SUBJECT_META[reviewState.subject]
    return (
      <div className="space-y-6">
        <header className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">錯題複習</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">{meta.label}</p>
          </div>
          <button
            onClick={() => setReviewState({ status: 'idle' })}
            className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
          >
            ← 返回
          </button>
        </header>

        {reviewState.subject === 'vocab' && (() => {
          if (reviewState.cards.length < 4) return (
            <p className="text-sm text-slate-500">錯題不足 4 張，多練幾輪後再回來！</p>
          )
          return <VocabQuiz cards={reviewState.cards} />
        })()}
        {reviewState.subject === 'grammar' && (() => {
          if (reviewState.cards.length < 4) return (
            <p className="text-sm text-slate-500">錯題不足 4 張，多練幾輪後再回來！</p>
          )
          return <GrammarQuiz cards={reviewState.cards} />
        })()}
        {reviewState.subject === 'kana' && (() => {
          if (reviewState.chars.length < 4) return (
            <p className="text-sm text-slate-500">錯題不足 4 張，多練幾輪後再回來！</p>
          )
          return <FlashCardQuiz chars={reviewState.chars} mode="kana→romaji" />
        })()}
      </div>
    )
  }

  // ── 錯題列表畫面 ──
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">錯題本</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">曾答錯且尚未熟悉的卡片</p>
      </header>

      {pageState.status === 'loading' && <p className="text-slate-400">載入中⋯</p>}
      {pageState.status === 'error' && <p className="text-red-500 text-sm">無法讀取學習記錄</p>}
      {pageState.status === 'ready' && (() => {
        const { weakIds } = pageState
        const total = weakIds.kana.length + weakIds.vocab.length + weakIds.grammar.length
        if (total === 0) {
          return (
            <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center text-sm text-slate-500">
              目前沒有錯題，繼續保持！
            </div>
          )
        }
        return (
          <div className="space-y-3">
            {(['kana', 'vocab', 'grammar'] as const).map((subject) => {
              const count = weakIds[subject].length
              if (count === 0) return null
              const meta = SUBJECT_META[subject]
              return (
                <div key={subject} className={`rounded-xl border ${meta.border} ${meta.bg} px-4 py-3 flex items-center justify-between`}>
                  <div>
                    <p className={`text-sm font-medium ${meta.color}`}>{meta.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{count} 張待加強</p>
                  </div>
                  <button
                    onClick={() => startReview(subject, weakIds[subject])}
                    className={`px-4 py-1.5 rounded-lg ${meta.btnColor} text-white text-xs font-medium transition-colors`}
                  >
                    開始複習
                  </button>
                </div>
              )
            })}
          </div>
        )
      })()}
    </div>
  )
}
