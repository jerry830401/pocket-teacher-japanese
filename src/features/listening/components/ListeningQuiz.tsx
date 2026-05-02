import { useReducer, useState, useEffect, useCallback } from 'react'
import type { VocabCard } from '@/features/vocabulary/types'
import { getOrCreateCard, saveCard } from '@/lib/db/db'
import { review } from '@/lib/srs/sm2'
import { speak } from '@/lib/tts/tts'
import { useSettings } from '@/stores/useSettings'


interface Props {
  cards: VocabCard[]
}

interface QuizState {
  deck: VocabCard[]
  index: number
  choices: VocabCard[]
  selected: string | null
  correct: number
  roundDone: boolean
}

type QuizAction =
  | { type: 'START'; deck: VocabCard[]; choices: VocabCard[] }
  | { type: 'PICK'; choiceId: string; isCorrect: boolean }
  | { type: 'NEXT'; index: number; choices: VocabCard[] }
  | { type: 'DONE' }

function reducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case 'START':
      return { deck: action.deck, index: 0, choices: action.choices, selected: null, correct: 0, roundDone: false }
    case 'PICK':
      return { ...state, selected: action.choiceId, correct: state.correct + (action.isCorrect ? 1 : 0) }
    case 'NEXT':
      return { ...state, index: action.index, choices: action.choices, selected: null }
    case 'DONE':
      return { ...state, roundDone: true }
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

function buildChoices(correct: VocabCard, pool: VocabCard[]): VocabCard[] {
  const wrong = shuffle(pool.filter((c) => c.id !== correct.id)).slice(0, 3)
  return shuffle([correct, ...wrong])
}

function buildRound(cards: VocabCard[], size: number): { deck: VocabCard[]; choices: VocabCard[] } {
  const deck = shuffle(cards).slice(0, size)
  return { deck, choices: buildChoices(deck[0], cards) }
}

export default function ListeningQuiz({ cards }: Props) {
  const autoNext = useSettings((s) => s.autoNextListening)
  const roundSize = useSettings((s) => s.roundSizeListening)
  const [state, dispatch] = useReducer(reducer, undefined, () => {
    const round = buildRound(cards, roundSize)
    return { deck: round.deck, index: 0, choices: round.choices, selected: null, correct: 0, roundDone: false }
  })
  const [ttsError, setTtsError] = useState(false)

  useEffect(() => {
    const round = buildRound(cards, roundSize)
    dispatch({ type: 'START', deck: round.deck, choices: round.choices })
  }, [cards, roundSize])

  const { deck, index, choices, selected, correct, roundDone } = state
  const current = deck[index]

  const playCurrentWord = useCallback(() => {
    if (!current) return
    setTtsError(false)
    speak(current.payload.reading, 'ja-JP', () => setTtsError(true))
  }, [current])

  function startNextRound() {
    const round = buildRound(cards, roundSize)
    dispatch({ type: 'START', deck: round.deck, choices: round.choices })
  }

  function advance(nextIndex: number) {
    if (nextIndex >= deck.length) {
      dispatch({ type: 'DONE' })
    } else {
      dispatch({ type: 'NEXT', index: nextIndex, choices: buildChoices(deck[nextIndex], cards) })
    }
  }

  async function pick(choice: VocabCard) {
    if (selected || !current) return
    const isCorrect = choice.id === current.id
    dispatch({ type: 'PICK', choiceId: choice.id, isCorrect })
    getOrCreateCard(current.id).then((card) => saveCard(review(card, isCorrect ? 5 : 1)))
    if (isCorrect && autoNext) {
      setTimeout(() => advance(index + 1), 400)
    }
  }

  if (roundDone) {
    const pct = Math.round((correct / deck.length) * 100)
    const msg = pct === 100 ? '完美！全部答對！'
      : pct >= 80 ? '答得很好，再接再厲！'
      : pct >= 60 ? '還不錯，繼續練習！'
      : '多練幾輪，加油！'
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '0 16px' }}>
        <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 32, color: 'var(--color-gold)' }}>{pct}%</div>
        <div style={{ fontFamily: '"VT323", monospace', fontSize: 18, color: 'var(--color-ink-soft)' }}>
          {deck.length} 題中答對 {correct} 題
        </div>
        <div className="pcard" style={{ background: 'var(--color-gold-soft)', textAlign: 'center', width: '100%', maxWidth: 280 }}>
          <p style={{ margin: 0, fontFamily: '"Zen Maru Gothic", sans-serif', fontSize: 14 }}>{msg}</p>
        </div>
        <button className="pbtn pbtn-primary" style={{ padding: '10px 24px', fontSize: 12 }} onClick={startNextRound}>
          下一輪（{roundSize} 題）
        </button>
      </div>
    )
  }

  if (!current) return null

  const isLastQuestion = index === deck.length - 1
  const showNext = selected !== null && !(autoNext && selected === current.id)
  const progress = ((index + (selected ? 1 : 0)) / deck.length) * 100

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '12px 0 16px', gap: 16 }}>
      {/* 進度區 */}
      <div style={{ flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontFamily: '"VT323", monospace', fontSize: 16, color: 'var(--color-ink-soft)' }}>
            第 {index + 1} / {deck.length} 題
          </span>
          <span style={{ fontFamily: '"VT323", monospace', fontSize: 16, color: 'var(--color-ink-soft)' }}>
            正確 {correct}
          </span>
        </div>
        <div className="px-bar">
          <span className="px-bar-fill" style={{ width: `${progress}%`, background: 'var(--color-gold)' }} />
        </div>
      </div>

      {/* 題目卡 */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="pcard" style={{
          background: 'var(--color-gold-soft)',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          padding: '24px 20px',
        }}>
          {/* 播放按鈕 */}
          <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <button
              onClick={playCurrentWord}
              aria-label="播放發音"
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

          {/* 答案揭示 */}
          <div style={{ flex: 1, opacity: selected ? 1 : 0, transition: 'opacity 0.2s', display: 'flex', flexDirection: 'column', gap: 4 }}>
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

      {/* 選項 */}
      <div style={{ flexShrink: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {choices.map((choice) => {
          const isCorrect = choice.id === current.id
          const isPicked = choice.id === selected
          let extraClass = 'px-choice'
          if (selected) {
            if (isCorrect) extraClass += ' px-choice-correct'
            else if (isPicked) extraClass += ' px-choice-wrong'
          }
          return (
            <button
              key={choice.id}
              className={extraClass}
              style={{ opacity: selected && !isCorrect && !isPicked ? 0.4 : 1, flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}
              onClick={() => pick(choice)}
            >
              <span style={{ fontFamily: '"Zen Maru Gothic", sans-serif', fontSize: 15, fontWeight: 700 }}>
                {choice.payload.word}
              </span>
              <span style={{ fontFamily: '"VT323", monospace', fontSize: 14, color: 'var(--color-ink-soft)' }}>
                {choice.payload.reading}
              </span>
            </button>
          )
        })}
      </div>

      {/* 下一題按鈕 */}
      <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
        <button
          className="pbtn pbtn-primary"
          style={{ padding: '10px 32px', fontSize: 13, visibility: showNext ? 'visible' : 'hidden', width: '100%' }}
          onClick={() => advance(index + 1)}
          disabled={!showNext}
        >
          {isLastQuestion ? '查看結果' : '下一題 →'}
        </button>
      </div>
    </div>
  )
}
