import { useReducer, useState, useEffect } from 'react'
import type { VocabCard } from '../types'
import { speak } from '@/lib/tts/tts'
import { markAsSeen } from '@/lib/db/db'
import TeacherBubble from '@/shared/TeacherBubble'
import { VOCAB_DONE_HINTS, getVocabHint, getVocabMood } from '@/shared/teacherHints'

const BATCH_SIZE = 5

const POS_LABEL: Record<string, string> = {
  noun: '名詞', verb: '動詞', 'i-adj': 'い形', 'na-adj': 'な形',
  adverb: '副詞', particle: '助詞', expression: '表現', other: '其他',
}


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

export default function VocabStudy({ cards }: { cards: VocabCard[] }) {
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

  useEffect(() => {
    if (deck[index]) markAsSeen(deck[index].id)
  }, [deck, index])

  if (deck.length === 0) return null

  if (batchDone) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '12px 0 16px', gap: 16 }}>
        <div style={{ flexShrink: 0 }}>
          <TeacherBubble
            hint={VOCAB_DONE_HINTS[Math.floor(Math.random() * VOCAB_DONE_HINTS.length)]}
            mood="happy"
          />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <div style={{ fontFamily: '"VT323", monospace', fontSize: '1.5rem', color: 'var(--color-ink-soft)' }}>
            已瀏覽 {BATCH_SIZE} 個單字
          </div>
          <button
            className="pbtn pbtn-primary"
            style={{ padding: '10px 24px', fontSize: '0.75rem' }}
            onClick={() => dispatch({ type: 'START', deck: shuffle(cards).slice(0, BATCH_SIZE) })}
          >
            下一組（{BATCH_SIZE} 個）
          </button>
        </div>
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

  const mood = getVocabMood(index, deck.length)
  const hint = getVocabHint(index, deck.length, current.payload.pos)

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '12px 0 16px', gap: 16 }}>
      {/* 老師泡泡 */}
      <div style={{ flexShrink: 0 }}>
        <TeacherBubble hint={hint} mood={mood} />
      </div>
      {/* 進度區 */}
      <div style={{ flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontFamily: '"VT323", monospace', fontSize: '1.375rem', color: 'var(--color-ink-soft)' }}>
            第 {index + 1} / {deck.length} 張
          </span>
        </div>
        <div className="px-bar">
          <span className="px-bar-fill" style={{ width: `${progress}%`, background: 'var(--color-indigo-px)' }} />
        </div>
      </div>

      {/* 卡片 */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="pcard" style={{
          background: 'var(--color-indigo-px-soft)',
          width: '100%',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 16,
          padding: '28px 20px',
        }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontFamily: '"DotGothic16", "Zen Maru Gothic", sans-serif', fontWeight: 700, fontSize: '2.625rem' }}>
              {current.payload.word}
            </span>
            <span style={{ fontFamily: '"VT323", monospace', fontSize: '1.375rem', color: 'var(--color-indigo-px)' }}>
              {current.payload.reading}
            </span>
            <span style={{ fontFamily: 'system-ui, sans-serif', fontSize: '0.9375rem', color: 'var(--color-ink-soft)' }}>
              {current.payload.meaning}
            </span>
            <span className="ptag" style={{ alignSelf: 'flex-start', marginTop: 4 }}>
              {POS_LABEL[current.payload.pos] ?? current.payload.pos}
            </span>
            {ttsError && (
              <span style={{ fontFamily: '"VT323", monospace', fontSize: '0.875rem', color: '#c8633a' }}>
                語音播放失敗
              </span>
            )}
          </div>
          <button
            onClick={play}
            aria-label={`播放 ${current.payload.word}`}
            className="px-play-btn"
            style={{
              flexShrink: 0,
              width: 48,
              height: 48,
              border: '3px solid var(--color-ink)',
              boxShadow: '3px 3px 0 var(--color-ink)',
              background: 'var(--color-indigo-px)',
              color: 'var(--color-paper)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.25rem',
            }}
          >
            ▶
          </button>
        </div>
      </div>

      {/* 導覽按鈕 */}
      <div style={{ flexShrink: 0, display: 'flex', gap: 10 }}>
        <button
          className="pbtn pbtn-ghost"
          style={{ flex: 1, padding: '10px 0', fontSize: '0.8125rem' }}
          onClick={() => goTo(index - 1)}
          disabled={index === 0}
        >
          上一張
        </button>
        <button
          className="pbtn pbtn-primary"
          style={{ flex: 2, padding: '10px 0', fontSize: '0.8125rem' }}
          onClick={() => index + 1 >= deck.length ? dispatch({ type: 'DONE' }) : goTo(index + 1)}
        >
          {index + 1 >= deck.length ? '完成這組' : '下一張 →'}
        </button>
      </div>
    </div>
  )
}
