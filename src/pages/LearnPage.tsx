import { useState, useEffect } from 'react'
import type { KanaChar, KanaType } from '@/features/kana/types'
import type { VocabCard } from '@/features/vocabulary/types'
import type { GrammarCard } from '@/features/grammar/types'
import { loadKana, filterByType } from '@/features/kana/data'
import { loadVocabulary, filterByLevel as filterVocab } from '@/features/vocabulary/data'
import { loadGrammar, filterByLevel as filterGrammar } from '@/features/grammar/data'
import { isSupported, preloadVoices } from '@/lib/tts/tts'
import KanaTable from '@/features/kana/components/KanaTable'
import VocabStudy from '@/features/vocabulary/components/VocabStudy'
import GrammarStudy from '@/features/grammar/components/GrammarStudy'
import ListeningStudy from '@/features/listening/components/ListeningStudy'

type Subject = 'kana' | 'vocab' | 'grammar' | 'listening'
type JlptLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1'
const LEVELS: JlptLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1']

const SUBJECTS: { id: Subject; label: string; icon: string }[] = [
  { id: 'kana',      label: '五十音', icon: 'あ' },
  { id: 'vocab',     label: '單字',   icon: '語' },
  { id: 'grammar',   label: '文法',   icon: '文' },
  { id: 'listening', label: '聽力',   icon: '音' },
]

// ── Kana section ─────────────────────────────────────────────
function KanaSection() {
  const [chars, setChars] = useState<KanaChar[]>([])
  const [kanaType, setKanaType] = useState<KanaType>('hiragana')
  const [showRomaji, setShowRomaji] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadKana()
      .then(setChars)
      .catch(() => setError('資料載入失敗，請重新整理頁面'))
  }, [])

  if (error) return <p className="text-red-500">{error}</p>

  const filtered = filterByType(chars, kanaType).filter((c) => c.group !== 'combo')

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-2">
          {(['hiragana', 'katakana'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setKanaType(t)}
              className={[
                'px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
                kanaType === t
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700',
              ].join(' ')}
            >
              {t === 'hiragana' ? '平假名' : '片假名'}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
          <input
            type="checkbox"
            checked={showRomaji}
            onChange={(e) => setShowRomaji(e.target.checked)}
            className="rounded"
          />
          顯示羅馬拼音
        </label>
      </div>
      {chars.length === 0
        ? <p className="text-slate-400">載入中⋯</p>
        : <KanaTable chars={filtered} showRomaji={showRomaji} />
      }
    </div>
  )
}

// ── Shared level selector ─────────────────────────────────────
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
    <div className="flex gap-2 flex-wrap">
      {LEVELS.map((l) => {
        const count = allCards.filter((c) => c.level === l).length
        const available = count > 0
        return (
          <button
            key={l}
            onClick={() => available && onChange(l)}
            disabled={!available}
            className={[
              'px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
              level === l
                ? active
                : available
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 cursor-not-allowed',
            ].join(' ')}
          >
            {l}
            {available && <span className="ml-1 text-xs opacity-60">{count}</span>}
          </button>
        )
      })}
    </div>
  )
}

// ── Vocab section ─────────────────────────────────────────────
function VocabSection({ allCards }: { allCards: VocabCard[] }) {
  const [level, setLevel] = useState<JlptLevel>('N5')
  const cards = filterVocab(allCards, level)
  return (
    <div className="space-y-4">
      <LevelSelector allCards={allCards} level={level} onChange={setLevel} color="indigo" />
      {cards.length > 0
        ? <VocabStudy cards={cards} />
        : <EmptyLevel level={level} />
      }
    </div>
  )
}

// ── Grammar section ───────────────────────────────────────────
function GrammarSection({ allCards }: { allCards: GrammarCard[] }) {
  const [level, setLevel] = useState<JlptLevel>('N5')
  const cards = filterGrammar(allCards, level)
  return (
    <div className="space-y-4">
      <LevelSelector allCards={allCards} level={level} onChange={setLevel} color="teal" />
      {cards.length > 0
        ? <GrammarStudy cards={cards} />
        : <EmptyLevel level={level} />
      }
    </div>
  )
}

// ── Listening section ─────────────────────────────────────────
function ListeningSection({ allCards }: { allCards: VocabCard[] }) {
  const [level, setLevel] = useState<JlptLevel>('N5')
  const cards = filterVocab(allCards, level)

  if (!isSupported()) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-700 p-6 text-sm text-slate-500">
        您的瀏覽器不支援語音合成（Web Speech API），請使用 Chrome 或 Safari。
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <LevelSelector allCards={allCards} level={level} onChange={setLevel} color="orange" />
      {cards.length > 0
        ? <ListeningStudy cards={cards} />
        : <EmptyLevel level={level} />
      }
    </div>
  )
}

function EmptyLevel({ level }: { level: JlptLevel }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-700 p-6 text-sm text-slate-500">
      {level} 資料尚未加入，敬請期待。
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────
export default function LearnPage() {
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
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">學習</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">瀏覽單字、文法規則與假名對照表</p>
      </header>

      {/* 科目 tabs */}
      <div className="flex gap-1 border-b border-slate-200 dark:border-slate-800">
        {SUBJECTS.map((s) => (
          <button
            key={s.id}
            onClick={() => setSubject(s.id)}
            className={[
              'flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
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

      {dataError && <p className="text-red-500 text-sm">{dataError}</p>}

      {subject === 'kana'      && <KanaSection />}
      {subject === 'vocab'     && <VocabSection allCards={vocabCards} />}
      {subject === 'grammar'   && <GrammarSection allCards={grammarCards} />}
      {subject === 'listening' && <ListeningSection allCards={vocabCards} />}
    </div>
  )
}
