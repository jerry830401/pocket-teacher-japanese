import { useState, useEffect, useMemo } from 'react'
import type { KanaChar, KanaGroup, KanaType } from '../types'
import { filterByType, filterByGroup } from '../data'
import TeacherBubble from '@/shared/TeacherBubble'
import { KANA_DONE_HINTS, getKanaHint, getKanaMood } from '@/shared/teacherHints'
import { speak } from '@/lib/tts/tts'

interface KanaStudyProps {
  kanaType: KanaType
  group: KanaGroup
  allChars: KanaChar[]
}

export default function KanaStudy({ kanaType, group, allChars }: KanaStudyProps) {
  const deck = useMemo(
    () => filterByGroup(filterByType(allChars, kanaType), group).sort((a, b) => a.order - b.order),
    [allChars, kanaType, group],
  )

  const [index, setIndex] = useState(0)
  const [done, setDone] = useState(false)
  const [ttsError, setTtsError] = useState(false)

  // reset when deck changes
  useEffect(() => {
    setIndex(0)
    setDone(false)
    setTtsError(false)
  }, [deck])

  if (deck.length === 0) return null

  if (done) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '12px 0 16px', gap: 16 }}>
        <div style={{ flexShrink: 0 }}>
          <TeacherBubble
            hint={KANA_DONE_HINTS[Math.floor(Math.random() * KANA_DONE_HINTS.length)]}
            mood="happy"
          />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <div style={{ fontFamily: '"VT323", monospace', fontSize: '1.5rem', color: 'var(--color-ink-soft)' }}>
            已瀏覽全部 {deck.length} 個假名
          </div>
          <button
            className="pbtn pbtn-primary"
            style={{ padding: '10px 24px', fontSize: '0.75rem' }}
            onClick={() => { setIndex(0); setDone(false) }}
          >
            再看一遍
          </button>
        </div>
      </div>
    )
  }

  const current = deck[index]
  const progress = ((index + 1) / deck.length) * 100
  const mood = getKanaMood(index, deck.length)
  const hint = getKanaHint(index, deck.length)

  function play() {
    setTtsError(false)
    speak(current.kana, 'ja-JP', () => setTtsError(true))
  }

  function goTo(i: number) {
    setIndex(i)
    setTtsError(false)
  }

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
          <span className="px-bar-fill" style={{ width: `${progress}%`, background: 'var(--color-ink)' }} />
        </div>
      </div>

      {/* 卡片 */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="pcard" style={{
          background: 'var(--color-paper)',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
          padding: 0,
          overflow: 'hidden',
        }}>
          {/* 假名 + 讀音 + 播放 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '20px 20px 16px' }}>
            <span className="kana" style={{ fontSize: '4rem', lineHeight: 1, width: 72, textAlign: 'center', flexShrink: 0 }}>
              {current.kana}
            </span>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontFamily: '"VT323", monospace', fontSize: '1.625rem', color: 'var(--color-ink-soft)' }}>
                {current.romaji}
              </span>
              {ttsError && (
                <span style={{ fontFamily: '"VT323", monospace', fontSize: '0.875rem', color: '#c8633a' }}>
                  語音播放失敗
                </span>
              )}
            </div>
            <button
              onClick={play}
              aria-label={`播放 ${current.kana}`}
              className="px-play-btn"
              style={{
                flexShrink: 0,
                width: 44,
                height: 44,
                border: '3px solid var(--color-ink)',
                boxShadow: '3px 3px 0 var(--color-ink)',
                background: 'var(--color-ink)',
                color: 'var(--color-paper)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.125rem',
              }}
            >
              ▶
            </button>
          </div>

          {/* 例字 */}
          {current.word && (
            <div style={{
              borderTop: '2px dashed var(--color-ink-faint)',
              padding: '12px 20px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                <span className="kana" style={{ fontSize: '1.0625rem', fontWeight: 900 }}>{current.word.word}</span>
                {current.word.word !== current.word.reading && (
                  <span style={{ fontSize: '0.8125rem', color: 'var(--color-ink-soft)' }}>（{current.word.reading}）</span>
                )}
                <span style={{ fontSize: '0.8125rem', color: 'var(--color-matcha-dark)', marginLeft: 'auto', flexShrink: 0 }}>
                  {current.word.meaning}
                </span>
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-ink-soft)', margin: 0 }}>{current.word.sentence}</p>
              <p style={{ fontSize: '0.6875rem', color: 'var(--color-ink-faint)', margin: 0 }}>{current.word.sentence_meaning}</p>
            </div>
          )}
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
          onClick={() => index + 1 >= deck.length ? setDone(true) : goTo(index + 1)}
        >
          {index + 1 >= deck.length ? '完成這行' : '下一張 →'}
        </button>
      </div>
    </div>
  )
}
