import { useReducer, useEffect } from 'react'
import type { GrammarCard } from '../types'
import { markAsSeen } from '@/lib/db/db'

const BATCH_SIZE = 5

interface StudyState {
  deck: GrammarCard[]
  index: number
  batchDone: boolean
}

type StudyAction =
  | { type: 'START'; deck: GrammarCard[] }
  | { type: 'GO'; index: number }
  | { type: 'DONE' }

function reducer(_state: StudyState, action: StudyAction): StudyState {
  switch (action.type) {
    case 'START': return { deck: action.deck, index: 0, batchDone: false }
    case 'GO': return { ..._state, index: action.index }
    case 'DONE': return { ..._state, batchDone: true }
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

function splitSentence(sentence: string): [string, string] {
  const idx = sentence.indexOf('___')
  if (idx === -1) return [sentence, '']
  return [sentence.slice(0, idx), sentence.slice(idx + 3)]
}

export default function GrammarStudy({ cards }: { cards: GrammarCard[] }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => ({
    deck: shuffle(cards).slice(0, BATCH_SIZE),
    index: 0,
    batchDone: false,
  }))
  const { deck, index, batchDone } = state

  useEffect(() => {
    dispatch({ type: 'START', deck: shuffle(cards).slice(0, BATCH_SIZE) })
  }, [cards])

  useEffect(() => {
    if (deck[index]) markAsSeen(deck[index].id)
  }, [deck, index])

  if (deck.length === 0) return null

  if (batchDone) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '0 16px' }}>
        <div style={{ fontFamily: '"VT323", monospace', fontSize: '1.5rem', color: 'var(--color-ink-soft)' }}>
          已瀏覽 {BATCH_SIZE} 個文法項目
        </div>
        <button
          className="pbtn pbtn-primary"
          style={{ padding: '10px 24px', fontSize: '0.75rem' }}
          onClick={() => dispatch({ type: 'START', deck: shuffle(cards).slice(0, BATCH_SIZE) })}
        >
          下一組（{BATCH_SIZE} 個）
        </button>
      </div>
    )
  }

  const current = deck[index]
  const [before, after] = splitSentence(current.payload.sentence)
  const progress = ((index + 1) / deck.length) * 100

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '12px 0 16px', gap: 16 }}>
      {/* 進度區 */}
      <div style={{ flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontFamily: '"VT323", monospace', fontSize: '1.375rem', color: 'var(--color-ink-soft)' }}>
            第 {index + 1} / {deck.length} 張
          </span>
        </div>
        <div className="px-bar">
          <span className="px-bar-fill" style={{ width: `${progress}%`, background: 'var(--color-matcha)' }} />
        </div>
      </div>

      {/* 卡片 */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="pcard" style={{
          background: 'var(--color-matcha-soft)',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          padding: '28px 20px',
        }}>
          <p style={{ margin: 0, fontFamily: '"DotGothic16", "Zen Maru Gothic", sans-serif', fontSize: '1.0625rem', fontWeight: 600, lineHeight: 2 }}>
            {before}
            <span style={{
              display: 'inline-block',
              minWidth: 48,
              marginInline: 4,
              paddingInline: 6,
              borderBottom: '2px solid var(--color-matcha)',
              color: 'var(--color-matcha)',
              textAlign: 'center',
            }}>
              {current.payload.answer}
            </span>
            {after}
          </p>
          <span style={{ fontFamily: '"VT323", monospace', fontSize: '1.625rem', color: 'var(--color-matcha)' }}>
            {current.payload.meaning}
          </span>
          <span style={{ fontFamily: 'system-ui, sans-serif', fontSize: '0.8125rem', color: 'var(--color-ink-soft)' }}>
            {current.payload.grammar}
          </span>
        </div>
      </div>

      {/* 導覽按鈕 */}
      <div style={{ flexShrink: 0, display: 'flex', gap: 10 }}>
        <button
          className="pbtn pbtn-ghost"
          style={{ flex: 1, padding: '10px 0', fontSize: '0.8125rem' }}
          onClick={() => dispatch({ type: 'GO', index: index - 1 })}
          disabled={index === 0}
        >
          上一張
        </button>
        <button
          className="pbtn pbtn-primary"
          style={{ flex: 2, padding: '10px 0', fontSize: '0.8125rem' }}
          onClick={() => index + 1 >= deck.length
            ? dispatch({ type: 'DONE' })
            : dispatch({ type: 'GO', index: index + 1 })}
        >
          {index + 1 >= deck.length ? '完成這組' : '下一張 →'}
        </button>
      </div>
    </div>
  )
}
