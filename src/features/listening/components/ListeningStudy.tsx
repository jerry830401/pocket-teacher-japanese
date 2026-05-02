import { useReducer, useState, useEffect } from 'react'
import type { VocabCard } from '@/features/vocabulary/types'
import { speak } from '@/lib/tts/tts'

const BATCH_SIZE = 5

interface StudyState {
  deck: VocabCard[]
  index: number
  batchDone: boolean
}

type StudyAction =
  | { type: 'START'; deck: VocabCard[] }
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

export default function ListeningStudy({ cards }: { cards: VocabCard[] }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => ({
    deck: shuffle(cards).slice(0, BATCH_SIZE),
    index: 0,
    batchDone: false,
  }))
  const [ttsError, setTtsError] = useState(false)
  const { deck, index, batchDone } = state

  useEffect(() => {
    dispatch({ type: 'START', deck: shuffle(cards).slice(0, BATCH_SIZE) })
  }, [cards])

  if (deck.length === 0) return null

  if (batchDone) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '0 16px' }}>
        <div style={{ fontFamily: '"VT323", monospace', fontSize: 18, color: 'var(--color-ink-soft)' }}>
          已聆聽 {BATCH_SIZE} 個單字
        </div>
        <button
          className="pbtn pbtn-primary"
          style={{ padding: '10px 24px', fontSize: 12 }}
          onClick={() => dispatch({ type: 'START', deck: shuffle(cards).slice(0, BATCH_SIZE) })}
        >
          下一組（{BATCH_SIZE} 個）
        </button>
      </div>
    )
  }

  const current = deck[index]
  const progress = ((index + 1) / deck.length) * 100

  function play() {
    setTtsError(false)
    speak(current.payload.reading, 'ja-JP', () => setTtsError(true))
  }

  function goTo(i: number) {
    dispatch({ type: 'GO', index: i })
    setTtsError(false)
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '12px 0 16px', gap: 16 }}>
      {/* 進度區 */}
      <div style={{ flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontFamily: '"VT323", monospace', fontSize: 16, color: 'var(--color-ink-soft)' }}>
            第 {index + 1} / {deck.length} 張
          </span>
        </div>
        <div className="px-bar">
          <span className="px-bar-fill" style={{ width: `${progress}%`, background: 'var(--color-gold)' }} />
        </div>
      </div>

      {/* 卡片 */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="pcard" style={{
          background: 'var(--color-gold-soft)',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          padding: '28px 20px',
        }}>
          {/* 播放按鈕 */}
          <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <button
              onClick={play}
              aria-label={`播放 ${current.payload.word}`}
              style={{
                width: 60,
                height: 60,
                border: '3px solid var(--color-ink)',
                boxShadow: '3px 3px 0 var(--color-ink)',
                background: 'var(--color-gold)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 26,
              }}
            >
              ▶
            </button>
            <span style={{
              fontFamily: '"VT323", monospace',
              fontSize: 14,
              color: ttsError ? '#c8633a' : 'var(--color-ink-soft)',
            }}>
              {ttsError ? '播放失敗' : '點擊播放'}
            </span>
          </div>

          {/* 分隔線 */}
          <div style={{ alignSelf: 'stretch', width: 2, background: 'var(--color-ink)', opacity: 0.15 }} />

          {/* 單字資訊 */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontFamily: '"Zen Maru Gothic", sans-serif', fontWeight: 700, fontSize: 28 }}>
              {current.payload.word}
            </span>
            <span style={{ fontFamily: '"VT323", monospace', fontSize: 20, color: 'var(--color-ink-soft)' }}>
              {current.payload.reading}
            </span>
            <span style={{ fontFamily: '"Zen Maru Gothic", sans-serif', fontSize: 13, color: 'var(--color-ink-soft)' }}>
              {current.payload.meaning}
            </span>
          </div>
        </div>
      </div>

      {/* 導覽按鈕 */}
      <div style={{ flexShrink: 0, display: 'flex', gap: 10 }}>
        <button
          className="pbtn pbtn-ghost"
          style={{ flex: 1, padding: '10px 0', fontSize: 13 }}
          onClick={() => goTo(index - 1)}
          disabled={index === 0}
        >
          上一張
        </button>
        <button
          className="pbtn pbtn-primary"
          style={{ flex: 2, padding: '10px 0', fontSize: 13 }}
          onClick={() => index + 1 >= deck.length ? dispatch({ type: 'DONE' }) : goTo(index + 1)}
        >
          {index + 1 >= deck.length ? '完成這組' : '下一張 →'}
        </button>
      </div>
    </div>
  )
}
