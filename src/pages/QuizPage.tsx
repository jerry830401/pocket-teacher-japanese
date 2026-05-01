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

// ── navigation stack ─────────────────────────────────────────────────────────

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
    if (s.id === 'kana-type')       parts.push('五十音')
    else if (s.id === 'kana-mode')  parts.push(s.kanaType === 'hiragana' ? '平假名' : '片假名')
    else if (s.id === 'kana-quiz')  parts.push(s.quizMode === 'kana→romaji' ? '看假名選讀音' : '看讀音選假名')
    else if (s.id === 'vocab-level')    parts.push('單字')
    else if (s.id === 'vocab-quiz')     parts.push(s.level)
    else if (s.id === 'grammar-level')  parts.push('文法')
    else if (s.id === 'grammar-quiz')   parts.push(s.level)
    else if (s.id === 'listening-level') parts.push('聽力')
    else if (s.id === 'listening-quiz')  parts.push(s.level)
  }
  return parts
}

// ── slide animation wrapper ───────────────────────────────────────────────────

function SlideScreen({ children, dir }: { children: React.ReactNode; dir: 'forward' | 'back' }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const from = dir === 'forward' ? 'translateX(40px)' : 'translateX(-40px)'
    el.animate([
      { opacity: 0, transform: from },
      { opacity: 1, transform: 'translateX(0)' },
    ], { duration: 260, easing: 'cubic-bezier(0.22,1,0.36,1)', fill: 'both' })
  }, [dir])
  return (
    <div ref={ref} className="h-full flex flex-col">
      {children}
    </div>
  )
}

// ── option button ─────────────────────────────────────────────────────────────

function OptionButton({
  label, sub, onClick, accent = 'indigo',
}: {
  label: string
  sub?: string
  onClick: () => void
  accent?: 'indigo' | 'teal' | 'orange'
}) {
  const border = {
    indigo: 'border-indigo-200 dark:border-indigo-800 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950',
    teal:   'border-teal-200 dark:border-teal-800 hover:border-teal-400 dark:hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-950',
    orange: 'border-orange-200 dark:border-orange-800 hover:border-orange-400 dark:hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950',
  }[accent]
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl border-2 transition-colors ${border}`}
    >
      <span className="font-medium text-slate-800 dark:text-slate-100">{label}</span>
      <div className="flex items-center gap-2">
        {sub && <span className="text-xs text-slate-400">{sub}</span>}
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-slate-400">
          <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
        </svg>
      </div>
    </button>
  )
}

// ── level grid ────────────────────────────────────────────────────────────────

function LevelGrid({
  allCards, onSelect, color,
}: {
  allCards: { level: string }[]
  onSelect: (l: JlptLevel) => void
  color: 'indigo' | 'teal' | 'orange'
}) {
  const hoverActive = {
    indigo: 'hover:border-indigo-400 hover:bg-indigo-50 dark:hover:border-indigo-500 dark:hover:bg-indigo-950',
    teal:   'hover:border-teal-400 hover:bg-teal-50 dark:hover:border-teal-500 dark:hover:bg-teal-950',
    orange: 'hover:border-orange-400 hover:bg-orange-50 dark:hover:border-orange-500 dark:hover:bg-orange-950',
  }[color]

  return (
    <div className="flex flex-col gap-2.5">
      {LEVELS.map((l) => {
        const count = allCards.filter((c) => c.level === l).length
        const available = count > 0
        return (
          <button
            key={l}
            onClick={() => available && onSelect(l)}
            disabled={!available}
            className={[
              'w-full flex items-center justify-between px-4 py-3.5 rounded-2xl border-2 transition-colors',
              available
                ? `border-slate-200 dark:border-slate-700 ${hoverActive}`
                : 'border-slate-100 dark:border-slate-800 opacity-40 cursor-not-allowed',
            ].join(' ')}
          >
            <span className="font-medium">{l}</span>
            <div className="flex items-center gap-2">
              {available && <span className="text-xs text-slate-400">{count} 題</span>}
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-slate-400">
                <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
              </svg>
            </div>
          </button>
        )
      })}
    </div>
  )
}

// ── quiz screens (no back button inside) ─────────────────────────────────────

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
          ? <p className="text-red-500 text-sm">{error}</p>
          : chars.length === 0
            ? <p className="text-slate-400">載入中⋯</p>
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
    <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-700 p-6 text-sm text-slate-500 space-y-1">
      <p>{level} 尚未學習足夠題目（至少需看過 {needed} 張卡片）。</p>
      <p>請先前往「學習」頁面瀏覽卡片，再回來測驗。</p>
    </div>
  )
}

// ── main page ─────────────────────────────────────────────────────────────────

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
    <div className="h-full flex flex-col pb-16 md:pb-0">
      {/* 頁首：麵包屑 + 右上返回（與學習頁相同結構） */}
      <div className="shrink-0 pt-4 pb-3 flex items-center gap-2">
        <h1 className="flex-1 min-w-0 text-base font-semibold tracking-tight truncate text-slate-900 dark:text-slate-100">
          {breadcrumb.join(' - ')}
        </h1>
        {canGoBack && (
          <button
            onClick={pop}
            className="shrink-0 flex items-center gap-1 text-sm text-indigo-600 dark:text-indigo-400"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" clipRule="evenodd" />
            </svg>
            返回
          </button>
        )}
      </div>

      {dataError && <p className="shrink-0 text-red-500 text-sm pb-2">{dataError}</p>}

      <div className="flex-1 min-h-0 overflow-hidden">
        {current.id === 'home' && (
          <SlideScreen key="home" dir={dir}>
            <div className="flex flex-col gap-2.5">
              <OptionButton label="五十音" sub="假名練習" onClick={() => push({ id: 'kana-type' })} accent="indigo" />
              <OptionButton label="單字" sub="JLPT 詞彙" onClick={() => push({ id: 'vocab-level' })} accent="indigo" />
              <OptionButton label="文法" sub="填空選擇" onClick={() => push({ id: 'grammar-level' })} accent="teal" />
              {isSupported() && (
                <OptionButton label="聽力" sub="聽音選字" onClick={() => push({ id: 'listening-level' })} accent="orange" />
              )}
            </div>
          </SlideScreen>
        )}

        {current.id === 'kana-type' && (
          <SlideScreen key="kana-type" dir={dir}>
            <div className="flex flex-col gap-2.5">
              <OptionButton label="平假名" sub="ひらがな" onClick={() => push({ id: 'kana-mode', kanaType: 'hiragana' })} accent="indigo" />
              <OptionButton label="片假名" sub="カタカナ" onClick={() => push({ id: 'kana-mode', kanaType: 'katakana' })} accent="indigo" />
            </div>
          </SlideScreen>
        )}

        {current.id === 'kana-mode' && (
          <SlideScreen key="kana-mode" dir={dir}>
            <div className="flex flex-col gap-2.5">
              <OptionButton
                label="看假名選讀音"
                sub="あ → a"
                onClick={() => push({ id: 'kana-quiz', kanaType: current.kanaType, quizMode: 'kana→romaji' })}
                accent="indigo"
              />
              <OptionButton
                label="看讀音選假名"
                sub="a → あ"
                onClick={() => push({ id: 'kana-quiz', kanaType: current.kanaType, quizMode: 'romaji→kana' })}
                accent="indigo"
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
            <LevelGrid allCards={vocabCards} onSelect={(l) => push({ id: 'vocab-quiz', level: l })} color="indigo" />
          </SlideScreen>
        )}

        {current.id === 'vocab-quiz' && (
          <VocabQuizScreen key={`vocab-quiz-${current.level}`} level={current.level} allCards={vocabCards} />
        )}

        {current.id === 'grammar-level' && (
          <SlideScreen key="grammar-level" dir={dir}>
            <LevelGrid allCards={grammarCards} onSelect={(l) => push({ id: 'grammar-quiz', level: l })} color="teal" />
          </SlideScreen>
        )}

        {current.id === 'grammar-quiz' && (
          <GrammarQuizScreen key={`grammar-quiz-${current.level}`} level={current.level} allCards={grammarCards} />
        )}

        {current.id === 'listening-level' && (
          <SlideScreen key="listening-level" dir={dir}>
            <LevelGrid allCards={vocabCards} onSelect={(l) => push({ id: 'listening-quiz', level: l })} color="orange" />
          </SlideScreen>
        )}

        {current.id === 'listening-quiz' && (
          <ListeningQuizScreen key={`listening-quiz-${current.level}`} level={current.level} allCards={vocabCards} />
        )}
      </div>
    </div>
  )
}
