import { useReducer, useEffect, useMemo } from 'react'
import type { GrammarCard } from '../types'
import { getOrCreateCard, saveCard } from '@/lib/db/db'
import { review } from '@/lib/srs/sm2'
import { useSettings } from '@/stores/useSettings'


interface Props {
  cards: GrammarCard[]
}

interface QuizState {
  deck: GrammarCard[]
  index: number
  selected: string | null
  correct: number
  roundDone: boolean
}

type QuizAction =
  | { type: 'START'; deck: GrammarCard[] }
  | { type: 'PICK'; choiceId: string; isCorrect: boolean }
  | { type: 'NEXT'; index: number }
  | { type: 'DONE' }

function reducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case 'START':
      return { deck: action.deck, index: 0, selected: null, correct: 0, roundDone: false }
    case 'PICK':
      return { ...state, selected: action.choiceId, correct: state.correct + (action.isCorrect ? 1 : 0) }
    case 'NEXT':
      return { ...state, index: action.index, selected: null }
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

function buildRound(cards: GrammarCard[], size: number): GrammarCard[] {
  return shuffle(cards).slice(0, size)
}

function splitSentence(sentence: string): [string, string] {
  const idx = sentence.indexOf('___')
  if (idx === -1) return [sentence, '']
  return [sentence.slice(0, idx), sentence.slice(idx + 3)]
}

export default function GrammarQuiz({ cards }: Props) {
  const autoNext = useSettings((s) => s.autoNextGrammar)
  const roundSize = useSettings((s) => s.roundSizeGrammar)
  const [state, dispatch] = useReducer(reducer, undefined, () => ({
    deck: buildRound(cards, roundSize),
    index: 0,
    selected: null,
    correct: 0,
    roundDone: false,
  }))

  useEffect(() => {
    dispatch({ type: 'START', deck: buildRound(cards, roundSize) })
  }, [cards, roundSize])

  const { deck, index, selected, correct, roundDone } = state
  const current = deck[index]

  const shuffledChoices = useMemo(
    () => (current ? shuffle(current.payload.choices) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [current?.id],
  )

  function startNextRound() {
    dispatch({ type: 'START', deck: buildRound(cards, roundSize) })
  }

  function advance(nextIndex: number) {
    if (nextIndex >= deck.length) {
      dispatch({ type: 'DONE' })
    } else {
      dispatch({ type: 'NEXT', index: nextIndex })
    }
  }

  async function pick(choice: string) {
    if (selected || !current) return
    const isCorrect = choice === current.payload.answer
    dispatch({ type: 'PICK', choiceId: choice, isCorrect })
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
        <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 32, color: 'var(--color-matcha)' }}>{pct}%</div>
        <div style={{ fontFamily: '"VT323", monospace', fontSize: 18, color: 'var(--color-ink-soft)' }}>
          {deck.length} 題中答對 {correct} 題
        </div>
        <div className="pcard" style={{ background: 'var(--color-matcha-soft)', textAlign: 'center', width: '100%', maxWidth: 280 }}>
          <p style={{ margin: 0, fontFamily: '"Zen Maru Gothic", sans-serif', fontSize: 14 }}>{msg}</p>
        </div>
        <button className="pbtn pbtn-primary" style={{ padding: '10px 24px', fontSize: 12 }} onClick={startNextRound}>
          下一輪（{roundSize} 題）
        </button>
      </div>
    )
  }

  if (!current) return null

  const [before, after] = splitSentence(current.payload.sentence)
  const isLastQuestion = index === deck.length - 1
  const showNext = selected !== null && !(autoNext && selected === current.payload.answer)
  const progress = ((index + (selected ? 1 : 0)) / deck.length) * 100
  const isAnswerCorrect = selected === current.payload.answer

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
          <span className="px-bar-fill" style={{ width: `${progress}%`, background: 'var(--color-matcha)' }} />
        </div>
      </div>

      {/* 題目卡 */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="pcard" style={{
          background: 'var(--color-matcha-soft)',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
          padding: '28px 16px',
        }}>
          {/* 填空句子 */}
          <p style={{ margin: 0, fontFamily: '"Zen Maru Gothic", sans-serif', fontSize: 17, fontWeight: 600, textAlign: 'center', lineHeight: 2 }}>
            {before}
            <span style={{
              display: 'inline-block',
              minWidth: 48,
              marginInline: 4,
              paddingInline: 6,
              borderBottom: `2px solid ${
                !selected ? 'var(--color-matcha)'
                  : isAnswerCorrect ? '#5c9e31'
                  : '#c8633a'
              }`,
              color: !selected ? 'var(--color-matcha)'
                : isAnswerCorrect ? '#5c9e31'
                : '#c8633a',
              textAlign: 'center',
              transition: 'color 0.15s, border-color 0.15s',
            }}>
              {selected ?? '　　'}
            </span>
            {after}
          </p>

          {/* 答案揭示 */}
          <div style={{ opacity: selected ? 1 : 0, transition: 'opacity 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <span style={{ fontFamily: '"VT323", monospace', fontSize: 20, color: 'var(--color-matcha)' }}>
              {current.payload.meaning}
            </span>
            <span style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 8, color: 'var(--color-ink-soft)' }}>
              {current.payload.grammar}
            </span>
          </div>
        </div>
      </div>

      {/* 選項 */}
      <div style={{ flexShrink: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {shuffledChoices.map((choice) => {
          const isCorrect = choice === current.payload.answer
          const isPicked = choice === selected
          let extraClass = 'px-choice'
          if (selected) {
            if (isCorrect) extraClass += ' px-choice-correct'
            else if (isPicked) extraClass += ' px-choice-wrong'
          }
          return (
            <button
              key={choice}
              className={extraClass}
              style={{ opacity: selected && !isCorrect && !isPicked ? 0.4 : 1, justifyContent: 'center' }}
              onClick={() => pick(choice)}
            >
              <span style={{ fontFamily: '"Zen Maru Gothic", sans-serif', fontSize: 15, fontWeight: 600 }}>
                {choice}
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
