import { useState, useEffect, useRef } from 'react'
import type { KanaChar, KanaType } from '@/features/kana/types'
import type { VocabCard } from '@/features/vocabulary/types'
import type { GrammarCard } from '@/features/grammar/types'
import { loadKana, filterByType } from '@/features/kana/data'
import { loadVocabulary, filterByLevel as filterVocab } from '@/features/vocabulary/data'
import { loadGrammar, filterByLevel as filterGrammar } from '@/features/grammar/data'
import { isSupported, preloadVoices } from '@/lib/tts/tts'
import { getSeenIds } from '@/lib/db/db'
import FlashCardQuiz from '@/features/kana/components/FlashCardQuiz'
import VocabQuiz from '@/features/vocabulary/components/VocabQuiz'
import GrammarQuiz from '@/features/grammar/components/GrammarQuiz'
import ListeningQuiz from '@/features/listening/components/ListeningQuiz'
import { useSettings } from '@/stores/useSettings'

type JlptLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1'
const LEVELS: JlptLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1']

// ── Navigation stack ──────────────────────────────────────────────────────────

type Screen =
  | { id: 'home' }
  | { id: 'kana-type' }
  | { id: 'kana-mode'; kanaType: KanaType }
  | { id: 'kana-quiz'; kanaType: KanaType; quizMode: 'kana→romaji' | 'romaji→kana' }
  | { id: 'vocab-level' }
  | { id: 'vocab-quiz'; level: JlptLevel }
  | { id: 'grammar-level' }
  | { id: 'grammar-quiz'; level: JlptLevel }
  | { id: 'listening-level' }
  | { id: 'listening-quiz'; level: JlptLevel }

function getBreadcrumb(stack: Screen[]): string[] {
  const parts = ['測驗']
  for (const s of stack.slice(1)) {
    if (s.id === 'kana-type')            parts.push('五十音')
    else if (s.id === 'kana-mode')       parts.push(s.kanaType === 'hiragana' ? '平假名' : '片假名')
    else if (s.id === 'kana-quiz')       parts.push(s.quizMode === 'kana→romaji' ? '看假名選讀音' : '看讀音選假名')
    else if (s.id === 'vocab-level')     parts.push('單字')
    else if (s.id === 'vocab-quiz')      parts.push(s.level)
    else if (s.id === 'grammar-level')   parts.push('文法')
    else if (s.id === 'grammar-quiz')    parts.push(s.level)
    else if (s.id === 'listening-level') parts.push('聽力')
    else if (s.id === 'listening-quiz')  parts.push(s.level)
  }
  return parts
}

// ── Slide animation wrapper ───────────────────────────────────────────────────

function SlideScreen({ children, dir }: { children: React.ReactNode; dir: 'forward' | 'back' }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const from = dir === 'forward' ? 'translateX(40px)' : 'translateX(-40px)'
    el.animate(
      [{ opacity: 0, transform: from }, { opacity: 1, transform: 'translateX(0)' }],
      { duration: 260, easing: 'cubic-bezier(0.22,1,0.36,1)', fill: 'both' },
    )
  }, [dir])
  return (
    <div ref={ref} className="h-full flex flex-col">
      {children}
    </div>
  )
}

// ── Pixel option button ───────────────────────────────────────────────────────

function OptionButton({
  label, sub, onClick, bg = 'var(--color-paper)',
}: {
  label: string
  sub?: string
  onClick: () => void
  bg?: string
}) {
  return (
    <button
      onClick={onClick}
      className="pcard-tap"
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        background: bg,
        border: '2.5px solid var(--color-ink)',
        boxShadow: '2px 2px 0 var(--color-ink)',
        padding: '14px',
        textAlign: 'left',
        cursor: 'pointer',
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: '"Zen Maru Gothic", sans-serif', fontWeight: 700, fontSize: 16 }}>{label}</div>
        {sub && <div style={{ fontFamily: '"VT323", monospace', fontSize: 16, color: 'var(--color-ink-soft)', marginTop: 1 }}>{sub}</div>}
      </div>
      <span style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 9, color: 'var(--color-ink-soft)' }}>→</span>
    </button>
  )
}

// ── Level grid (pixel cards) ──────────────────────────────────────────────────

const LEVEL_BG: Record<string, string> = {
  N5: 'var(--color-matcha-soft)',
  N4: 'var(--color-paper)',
  N3: 'var(--color-sakura-soft)',
  N2: 'var(--color-indigo-px-soft)',
  N1: 'var(--color-cream)',
}

function LevelGrid({
  allCards, onSelect,
}: {
  allCards: { level: string }[]
  onSelect: (l: JlptLevel) => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {LEVELS.map((l) => {
        const count = allCards.filter((c) => c.level === l).length
        const available = count > 0
        return (
          <button
            key={l}
            onClick={() => available && onSelect(l)}
            disabled={!available}
            className={available ? 'pcard-tap' : ''}
            style={{
              background: available ? LEVEL_BG[l] : 'var(--color-cream-2)',
              border: '2.5px solid var(--color-ink)',
              boxShadow: available ? '2px 2px 0 var(--color-ink)' : 'none',
              padding: '14px',
              opacity: available ? 1 : 0.45,
              cursor: available ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              textAlign: 'left',
            }}
          >
            <div style={{
              width: 44, height: 44,
              border: '3px solid var(--color-ink)',
              background: 'var(--color-paper)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: '"Press Start 2P", monospace',
              fontSize: 11,
              flexShrink: 0,
            }}>{l}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: '"Zen Maru Gothic", sans-serif', fontWeight: 700, fontSize: 15 }}>{l}</div>
              {available
                ? <div style={{ fontFamily: '"VT323", monospace', fontSize: 16, color: 'var(--color-ink-soft)' }}>{count} 題</div>
                : <div style={{ fontFamily: '"VT323", monospace', fontSize: 16, color: 'var(--color-ink-faint)' }}>即將推出</div>
              }
            </div>
            {available && <span style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 9, color: 'var(--color-ink-soft)' }}>→</span>}
          </button>
        )
      })}
    </div>
  )
}

// ── Quiz screens ──────────────────────────────────────────────────────────────

function KanaQuizScreen({ kanaType, quizMode }: { kanaType: KanaType; quizMode: 'kana→romaji' | 'romaji→kana' }) {
  const [chars, setChars] = useState<KanaChar[]>([])
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    loadKana().then(setChars).catch(() => setError('資料載入失敗，請重新整理頁面'))
  }, [])
  const filtered = filterByType(chars, kanaType).filter((c) => c.group !== 'combo')
  return (
    <SlideScreen dir="forward">
      <div className="flex-1 min-h-0">
        {error
          ? <p style={{ color: '#c8633a', fontSize: 13 }}>{error}</p>
          : chars.length === 0
            ? <p style={{ color: 'var(--color-ink-soft)', fontSize: 14 }}>載入中⋯</p>
            : <FlashCardQuiz chars={filtered} mode={quizMode} />
        }
      </div>
    </SlideScreen>
  )
}

function VocabQuizScreen({ level, allCards }: { level: JlptLevel; allCards: VocabCard[] }) {
  const roundSize = useSettings((s) => s.roundSizeVocab)
  const [seenCards, setSeenCards] = useState<VocabCard[] | null>(null)
  const levelCards = filterVocab(allCards, level)
  useEffect(() => {
    const ids$ = levelCards.length === 0
      ? Promise.resolve(new Set<string>())
      : getSeenIds(levelCards.map((c) => c.id))
    ids$.then((ids) => setSeenCards(levelCards.filter((c) => ids.has(c.id))))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, allCards])
  return (
    <SlideScreen dir="forward">
      <div className="flex-1 min-h-0">
        {seenCards === null
          ? null
          : seenCards.length >= roundSize
            ? <VocabQuiz cards={seenCards} />
            : <NotStudied level={level} needed={roundSize} />
        }
      </div>
    </SlideScreen>
  )
}

function GrammarQuizScreen({ level, allCards }: { level: JlptLevel; allCards: GrammarCard[] }) {
  const roundSize = useSettings((s) => s.roundSizeGrammar)
  const [seenCards, setSeenCards] = useState<GrammarCard[] | null>(null)
  const levelCards = filterGrammar(allCards, level)
  useEffect(() => {
    const ids$ = levelCards.length === 0
      ? Promise.resolve(new Set<string>())
      : getSeenIds(levelCards.map((c) => c.id))
    ids$.then((ids) => setSeenCards(levelCards.filter((c) => ids.has(c.id))))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, allCards])
  return (
    <SlideScreen dir="forward">
      <div className="flex-1 min-h-0">
        {seenCards === null
          ? null
          : seenCards.length >= roundSize
            ? <GrammarQuiz cards={seenCards} />
            : <NotStudied level={level} needed={roundSize} />
        }
      </div>
    </SlideScreen>
  )
}

function ListeningQuizScreen({ level, allCards }: { level: JlptLevel; allCards: VocabCard[] }) {
  const roundSize = useSettings((s) => s.roundSizeListening)
  const [seenCards, setSeenCards] = useState<VocabCard[] | null>(null)
  const levelCards = filterVocab(allCards, level)
  useEffect(() => {
    const ids$ = levelCards.length === 0
      ? Promise.resolve(new Set<string>())
      : getSeenIds(levelCards.map((c) => c.id))
    ids$.then((ids) => setSeenCards(levelCards.filter((c) => ids.has(c.id))))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, allCards])
  return (
    <SlideScreen dir="forward">
      <div className="flex-1 min-h-0">
        {seenCards === null
          ? null
          : seenCards.length >= roundSize
            ? <ListeningQuiz cards={seenCards} />
            : <NotStudied level={level} needed={roundSize} />
        }
      </div>
    </SlideScreen>
  )
}

function NotStudied({ level, needed }: { level: JlptLevel; needed: number }) {
  return (
    <div className="pcard" style={{ background: 'var(--color-sakura-soft)' }}>
      <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 9, lineHeight: 1.6, marginBottom: 8 }}>
        尚未學習足夠題目
      </div>
      <p style={{ fontSize: 14, margin: 0, color: 'var(--color-ink-soft)' }}>
        {level} 至少需看過 {needed} 張卡片。請先前往「學習」頁面瀏覽，再回來測驗。
      </p>
    </div>
  )
}

// ── Home screen option cards ──────────────────────────────────────────────────

const HOME_OPTIONS: Array<{
  label: string; sub: string; bg: string; screen: string; ttsOnly?: boolean
}> = [
  { label: '五十音', sub: '假名練習', bg: 'var(--color-paper)',           screen: 'kana-type'       },
  { label: '單字',   sub: 'JLPT 詞彙', bg: 'var(--color-sakura-soft)',   screen: 'vocab-level'     },
  { label: '文法',   sub: '填空選擇', bg: 'var(--color-matcha-soft)',    screen: 'grammar-level'   },
  { label: '聽力',   sub: '聽音選字', bg: 'var(--color-indigo-px-soft)', screen: 'listening-level', ttsOnly: true },
]

// ── Main page ─────────────────────────────────────────────────────────────────

export default function QuizPage() {
  const [stack, setStack] = useState<Screen[]>([{ id: 'home' }])
  const [dir, setDir] = useState<'forward' | 'back'>('forward')
  const [vocabCards, setVocabCards] = useState<VocabCard[]>([])
  const [grammarCards, setGrammarCards] = useState<GrammarCard[]>([])
  const [dataError, setDataError] = useState<string | null>(null)

  useEffect(() => {
    preloadVoices()
    Promise.all([loadVocabulary(), loadGrammar()])
      .then(([vocab, grammar]) => { setVocabCards(vocab); setGrammarCards(grammar) })
      .catch(() => setDataError('資料載入失敗，請重新整理頁面'))
  }, [])

  const current = stack[stack.length - 1]
  const canGoBack = stack.length > 1
  const breadcrumb = getBreadcrumb(stack)

  function push(screen: Screen) {
    setDir('forward')
    setStack((s) => [...s, screen])
  }

  function pop() {
    if (!canGoBack) return
    setDir('back')
    setStack((s) => s.slice(0, -1))
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 頁首 */}
      <div style={{
        flexShrink: 0,
        padding: '14px 16px 10px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <span style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 11, lineHeight: 1.4, flexShrink: 0 }}>
          測驗
        </span>
        {breadcrumb.length > 1 && (
          <span style={{
            flex: 1,
            fontFamily: '"Press Start 2P", monospace',
            fontSize: 9,
            lineHeight: 1.4,
            color: 'var(--color-ink-soft)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {breadcrumb.slice(1).join(' › ')}
          </span>
        )}
        {!breadcrumb.length || breadcrumb.length <= 1 ? <span style={{ flex: 1 }} /> : null}
        {canGoBack && (
          <button className="pbtn pbtn-ghost" style={{ padding: '4px 10px', fontSize: 13, flexShrink: 0 }} onClick={pop}>
            ← 返回
          </button>
        )}
      </div>

      {dataError && (
        <p style={{ color: '#c8633a', fontSize: 13, padding: '0 16px 8px', flexShrink: 0 }}>{dataError}</p>
      )}

      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', padding: '0 16px 8px' }}>
        {current.id === 'home' && (
          <SlideScreen key="home" dir={dir}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {HOME_OPTIONS.map((opt) => {
                if (opt.ttsOnly && !isSupported()) return null
                return (
                  <OptionButton
                    key={opt.label}
                    label={opt.label}
                    sub={opt.sub}
                    bg={opt.bg}
                    onClick={() => push({ id: opt.screen } as Screen)}
                  />
                )
              })}
            </div>
          </SlideScreen>
        )}

        {current.id === 'kana-type' && (
          <SlideScreen key="kana-type" dir={dir}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <OptionButton label="平假名" sub="ひらがな" onClick={() => push({ id: 'kana-mode', kanaType: 'hiragana' })} />
              <OptionButton label="片假名" sub="カタカナ" onClick={() => push({ id: 'kana-mode', kanaType: 'katakana' })} bg="var(--color-indigo-px-soft)" />
            </div>
          </SlideScreen>
        )}

        {current.id === 'kana-mode' && (
          <SlideScreen key="kana-mode" dir={dir}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <OptionButton
                label="看假名選讀音"
                sub="あ → a"
                onClick={() => push({ id: 'kana-quiz', kanaType: current.kanaType, quizMode: 'kana→romaji' })}
              />
              <OptionButton
                label="看讀音選假名"
                sub="a → あ"
                bg="var(--color-cream)"
                onClick={() => push({ id: 'kana-quiz', kanaType: current.kanaType, quizMode: 'romaji→kana' })}
              />
            </div>
          </SlideScreen>
        )}

        {current.id === 'kana-quiz' && (
          <KanaQuizScreen
            key={`kana-quiz-${current.kanaType}-${current.quizMode}`}
            kanaType={current.kanaType}
            quizMode={current.quizMode}
          />
        )}

        {current.id === 'vocab-level' && (
          <SlideScreen key="vocab-level" dir={dir}>
            <LevelGrid allCards={vocabCards} onSelect={(l) => push({ id: 'vocab-quiz', level: l })} />
          </SlideScreen>
        )}

        {current.id === 'vocab-quiz' && (
          <VocabQuizScreen key={`vocab-quiz-${current.level}`} level={current.level} allCards={vocabCards} />
        )}

        {current.id === 'grammar-level' && (
          <SlideScreen key="grammar-level" dir={dir}>
            <LevelGrid allCards={grammarCards} onSelect={(l) => push({ id: 'grammar-quiz', level: l })} />
          </SlideScreen>
        )}

        {current.id === 'grammar-quiz' && (
          <GrammarQuizScreen key={`grammar-quiz-${current.level}`} level={current.level} allCards={grammarCards} />
        )}

        {current.id === 'listening-level' && (
          <SlideScreen key="listening-level" dir={dir}>
            <LevelGrid allCards={vocabCards} onSelect={(l) => push({ id: 'listening-quiz', level: l })} />
          </SlideScreen>
        )}

        {current.id === 'listening-quiz' && (
          <ListeningQuizScreen key={`listening-quiz-${current.level}`} level={current.level} allCards={vocabCards} />
        )}
      </div>
    </div>
  )
}
