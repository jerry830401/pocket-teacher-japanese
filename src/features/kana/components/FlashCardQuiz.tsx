import { useReducer, useEffect } from 'react'
import type { KanaChar } from '../types'
import { getOrCreateCard, saveCard } from '@/lib/db/db'
import { review } from '@/lib/srs/sm2'
import { useSettings } from '@/stores/useSettings'


type Mode = 'kana→romaji' | 'romaji→kana'

interface Props {
  chars: KanaChar[]
  mode: Mode
}

interface QuizState {
  deck: KanaChar[]
  index: number
  choices: KanaChar[]
  selected: string | null
  correct: number
  roundDone: boolean
}

type QuizAction =
  | { type: 'START'; deck: KanaChar[]; choices: KanaChar[] }
  | { type: 'PICK'; choiceId: string; isCorrect: boolean }
  | { type: 'NEXT'; index: number; choices: KanaChar[] }
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

function buildChoices(correct: KanaChar, pool: KanaChar[]): KanaChar[] {
  const wrong = shuffle(pool.filter((c) => c.id !== correct.id)).slice(0, 3)
  return shuffle([correct, ...wrong])
}

function buildRound(chars: KanaChar[], size: number): { deck: KanaChar[]; choices: KanaChar[] } {
  const deck = shuffle(chars).slice(0, size)
  return { deck, choices: buildChoices(deck[0], chars) }
}

export default function FlashCardQuiz({ chars, mode }: Props) {
  const autoNext = useSettings((s) => s.autoNextKana)
  const roundSize = useSettings((s) => s.roundSizeKana)
  const [state, dispatch] = useReducer(reducer, undefined, () => {
    const round = buildRound(chars, roundSize)
    return { deck: round.deck, index: 0, choices: round.choices, selected: null, correct: 0, roundDone: false }
  })

  useEffect(() => {
    const round = buildRound(chars, roundSize)
    dispatch({ type: 'START', deck: round.deck, choices: round.choices })
  }, [chars, roundSize])

  const { deck, index, choices, selected, correct, roundDone } = state
  const current = deck[index]

  function startNextRound() {
    const round = buildRound(chars, roundSize)
    dispatch({ type: 'START', deck: round.deck, choices: round.choices })
  }

  function advance(nextIndex: number) {
    if (nextIndex >= deck.length) {
      dispatch({ type: 'DONE' })
    } else {
      dispatch({ type: 'NEXT', index: nextIndex, choices: buildChoices(deck[nextIndex], chars) })
    }
  }

  async function pick(choice: KanaChar) {
    if (selected || !current) return
    const isCorrect = choice.id === current.id
    dispatch({ type: 'PICK', choiceId: choice.id, isCorrect })
    getOrCreateCard(`kana-${current.id}`).then((card) => saveCard(review(card, isCorrect ? 5 : 1)))
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
        <div style={{ fontFamily: 'system-ui, sans-serif', fontSize: '2rem', color: 'var(--color-indigo-px)' }}>{pct}%</div>
        <div style={{ fontFamily: '"VT323", monospace', fontSize: '1.5rem', color: 'var(--color-ink-soft)' }}>
          {deck.length} 題中答對 {correct} 題
        </div>
        <div className="pcard" style={{ background: 'var(--color-indigo-px-soft)', textAlign: 'center', width: '100%', maxWidth: 280 }}>
          <p style={{ margin: 0, fontFamily: 'system-ui, sans-serif', fontSize: '0.875rem' }}>{msg}</p>
        </div>
        <button className="pbtn pbtn-primary" style={{ padding: '10px 24px', fontSize: '0.75rem' }} onClick={startNextRound}>
          下一輪（{roundSize} 題）
        </button>
      </div>
    )
  }

  if (!current) return null

  const isLastQuestion = index === deck.length - 1
  const prompt = mode === 'kana→romaji' ? current.kana : current.romaji
  const answerKey = (c: KanaChar) => mode === 'kana→romaji' ? c.romaji : c.kana
  const showNext = selected !== null && !(autoNext && selected === current.id)
  const progress = ((index + (selected ? 1 : 0)) / deck.length) * 100

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '12px 0 16px', gap: 16 }}>
      {/* 進度區 */}
      <div style={{ flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontFamily: '"VT323", monospace', fontSize: '1.375rem', color: 'var(--color-ink-soft)' }}>
            第 {index + 1} / {deck.length} 題
          </span>
          <span style={{ fontFamily: '"VT323", monospace', fontSize: '1.375rem', color: 'var(--color-ink-soft)' }}>
            正確 {correct}
          </span>
        </div>
        <div className="px-bar">
          <span className="px-bar-fill" style={{ width: `${progress}%`, background: 'var(--color-indigo-px)' }} />
        </div>
      </div>

      {/* 題目卡 */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="pcard" style={{
          background: 'var(--color-indigo-px-soft)',
          width: 160,
          height: 160,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <span style={{ fontFamily: '"DotGothic16", "Zen Maru Gothic", sans-serif', fontWeight: 700, fontSize: '4.5rem' }}>
            {prompt}
          </span>
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
              style={{ opacity: selected && !isCorrect && !isPicked ? 0.4 : 1, justifyContent: 'center' }}
              onClick={() => pick(choice)}
            >
              <span style={{ fontFamily: '"DotGothic16", "Zen Maru Gothic", sans-serif', fontSize: '1.25rem', fontWeight: 700 }}>
                {answerKey(choice)}
              </span>
            </button>
          )
        })}
      </div>

      {/* 下一題按鈕 */}
      <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
        <button
          className="pbtn pbtn-primary"
          style={{ padding: '10px 32px', fontSize: '0.8125rem', visibility: showNext ? 'visible' : 'hidden', width: '100%' }}
          onClick={() => advance(index + 1)}
          disabled={!showNext}
        >
          {isLastQuestion ? '查看結果' : '下一題 →'}
        </button>
      </div>
    </div>
  )
}
