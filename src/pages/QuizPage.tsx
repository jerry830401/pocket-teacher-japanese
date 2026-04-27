import { useState, useEffect } from 'react'
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

type Subject = 'kana' | 'vocab' | 'grammar' | 'listening'
type JlptLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1'
const LEVELS: JlptLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1']

const SUBJECTS: { id: Subject; label: string; icon: string }[] = [
  { id: 'kana',      label: '五十音', icon: 'あ' },
  { id: 'vocab',     label: '單字',   icon: '語' },
  { id: 'grammar',   label: '文法',   icon: '文' },
  { id: 'listening', label: '聽力',   icon: '音' },
]

function KanaSection() {
  const [chars, setChars] = useState<KanaChar[]>([])
  const [kanaType, setKanaType] = useState<KanaType>('hiragana')
  const [quizMode, setQuizMode] = useState<'kana→romaji' | 'romaji→kana'>('kana→romaji')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadKana()
      .then(setChars)
      .catch(() => setError('資料載入失敗，請重新整理頁面'))
  }, [])

  if (error) return <p className="text-red-500">{error}</p>

  const filtered = filterByType(chars, kanaType).filter((c) => c.group !== 'combo')

  return (
    <div className="h-full flex flex-col">
      <div className="shrink-0 flex gap-2 flex-wrap pb-3">
        {(['hiragana', 'katakana'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setKanaType(t)}
            className={[
              'px-3 py-1 rounded-full text-sm font-medium transition-colors',
              kanaType === t
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700',
            ].join(' ')}
          >
            {t === 'hiragana' ? '平假名' : '片假名'}
          </button>
        ))}
        {(['kana→romaji', 'romaji→kana'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setQuizMode(m)}
            className={[
              'px-3 py-1 rounded-full text-xs font-medium transition-colors',
              quizMode === m
                ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700',
            ].join(' ')}
          >
            {m === 'kana→romaji' ? '看假名選讀音' : '看讀音選假名'}
          </button>
        ))}
      </div>
      <div className="flex-1 min-h-0">
        {chars.length === 0
          ? <p className="text-slate-400">載入中⋯</p>
          : <FlashCardQuiz chars={filtered} mode={quizMode} />
        }
      </div>
    </div>
  )
}

function LevelSelector({
  allCards, level, onChange, color,
}: {
  allCards: { level: string }[]
  level: JlptLevel
  onChange: (l: JlptLevel) => void
  color: 'indigo' | 'teal' | 'orange'
}) {
  const active = {
    indigo: 'bg-indigo-600 text-white',
    teal:   'bg-teal-600 text-white',
    orange: 'bg-orange-500 text-white',
  }[color]

  return (
    <div className="flex gap-1.5 flex-wrap">
      {LEVELS.map((l) => {
        const count = allCards.filter((c) => c.level === l).length
        const available = count > 0
        return (
          <button
            key={l}
            onClick={() => available && onChange(l)}
            disabled={!available}
            className={[
              'px-3 py-1 rounded-full text-xs font-medium transition-colors',
              level === l
                ? active
                : available
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 cursor-not-allowed',
            ].join(' ')}
          >
            {l}
            {available && <span className="ml-1 opacity-60">{count}</span>}
          </button>
        )
      })}
    </div>
  )
}

function VocabSection({ allCards }: { allCards: VocabCard[] }) {
  const roundSize = useSettings((s) => s.roundSizeVocab)
  const [level, setLevel] = useState<JlptLevel>('N5')
  const [seenCards, setSeenCards] = useState<VocabCard[] | null>(null)
  const levelCards = filterVocab(allCards, level)

  useEffect(() => {
    if (levelCards.length === 0) { setSeenCards([]); return }
    getSeenIds(levelCards.map((c) => c.id)).then((ids) =>
      setSeenCards(levelCards.filter((c) => ids.has(c.id)))
    )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, allCards])

  return (
    <div className="h-full flex flex-col">
      <div className="shrink-0 pb-3">
        <LevelSelector allCards={allCards} level={level} onChange={setLevel} color="indigo" />
      </div>
      <div className="flex-1 min-h-0">
        {seenCards === null
          ? null
          : seenCards.length >= roundSize
            ? <VocabQuiz cards={seenCards} />
            : <NotStudied level={level} needed={roundSize} />
        }
      </div>
    </div>
  )
}

function GrammarSection({ allCards }: { allCards: GrammarCard[] }) {
  const roundSize = useSettings((s) => s.roundSizeGrammar)
  const [level, setLevel] = useState<JlptLevel>('N5')
  const [seenCards, setSeenCards] = useState<GrammarCard[] | null>(null)
  const levelCards = filterGrammar(allCards, level)

  useEffect(() => {
    if (levelCards.length === 0) { setSeenCards([]); return }
    getSeenIds(levelCards.map((c) => c.id)).then((ids) =>
      setSeenCards(levelCards.filter((c) => ids.has(c.id)))
    )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, allCards])

  return (
    <div className="h-full flex flex-col">
      <div className="shrink-0 pb-3">
        <LevelSelector allCards={allCards} level={level} onChange={setLevel} color="teal" />
      </div>
      <div className="flex-1 min-h-0">
        {seenCards === null
          ? null
          : seenCards.length >= roundSize
            ? <GrammarQuiz cards={seenCards} />
            : <NotStudied level={level} needed={roundSize} />
        }
      </div>
    </div>
  )
}

function ListeningSection({ allCards }: { allCards: VocabCard[] }) {
  const roundSize = useSettings((s) => s.roundSizeListening)
  const [level, setLevel] = useState<JlptLevel>('N5')
  const [seenCards, setSeenCards] = useState<VocabCard[] | null>(null)
  const levelCards = filterVocab(allCards, level)

  useEffect(() => {
    if (levelCards.length === 0) { setSeenCards([]); return }
    getSeenIds(levelCards.map((c) => c.id)).then((ids) =>
      setSeenCards(levelCards.filter((c) => ids.has(c.id)))
    )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, allCards])

  if (!isSupported()) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-700 p-6 text-sm text-slate-500">
        您的瀏覽器不支援語音合成（Web Speech API），請使用 Chrome 或 Safari。
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="shrink-0 pb-3">
        <LevelSelector allCards={allCards} level={level} onChange={setLevel} color="orange" />
      </div>
      <div className="flex-1 min-h-0">
        {seenCards === null
          ? null
          : seenCards.length >= roundSize
            ? <ListeningQuiz cards={seenCards} />
            : <NotStudied level={level} needed={roundSize} />
        }
      </div>
    </div>
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

export default function QuizPage() {
  const [subject, setSubject] = useState<Subject>('kana')
  const [vocabCards, setVocabCards] = useState<VocabCard[]>([])
  const [grammarCards, setGrammarCards] = useState<GrammarCard[]>([])
  const [dataError, setDataError] = useState<string | null>(null)

  useEffect(() => {
    preloadVoices()
    Promise.all([loadVocabulary(), loadGrammar()])
      .then(([vocab, grammar]) => {
        setVocabCards(vocab)
        setGrammarCards(grammar)
      })
      .catch(() => setDataError('資料載入失敗，請重新整理頁面'))
  }, [])

  return (
    <div className="h-full flex flex-col pb-16 md:pb-0">
      {/* 頁首 */}
      <div className="shrink-0 pt-4 pb-2 pr-10 md:pr-0">
        <h1 className="text-xl font-semibold tracking-tight">測驗</h1>
      </div>

      {/* 科目 tabs */}
      <div className="shrink-0 flex gap-1 border-b border-slate-200 dark:border-slate-800">
        {SUBJECTS.map((s) => (
          <button
            key={s.id}
            onClick={() => setSubject(s.id)}
            className={[
              'flex items-center gap-1 px-2.5 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
              subject === s.id
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300',
            ].join(' ')}
          >
            <span className="text-base leading-none">{s.icon}</span>
            {s.label}
          </button>
        ))}
      </div>

      {dataError && <p className="shrink-0 text-red-500 text-sm pt-2">{dataError}</p>}

      {/* 內容區 */}
      <div className="flex-1 min-h-0 pt-3">
        {subject === 'kana'      && <KanaSection />}
        {subject === 'vocab'     && <VocabSection allCards={vocabCards} />}
        {subject === 'grammar'   && <GrammarSection allCards={grammarCards} />}
        {subject === 'listening' && <ListeningSection allCards={vocabCards} />}
      </div>
    </div>
  )
}
