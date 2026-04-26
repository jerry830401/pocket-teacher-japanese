import { useState, useEffect } from 'react'
import type { KanaChar, KanaType } from '@/features/kana/types'
import type { VocabCard } from '@/features/vocabulary/types'
import type { GrammarCard } from '@/features/grammar/types'
import { loadKana, filterByType } from '@/features/kana/data'
import { loadVocabulary, filterByLevel as filterVocab } from '@/features/vocabulary/data'
import { loadGrammar, filterByLevel as filterGrammar } from '@/features/grammar/data'
import { preloadVoices } from '@/lib/tts/tts'
import KanaTable from '@/features/kana/components/KanaTable'
import VocabStudy from '@/features/vocabulary/components/VocabStudy'
import GrammarStudy from '@/features/grammar/components/GrammarStudy'

type Subject = 'kana' | 'vocab' | 'grammar'
type JlptLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1'
const LEVELS: JlptLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1']

const SUBJECTS: { id: Subject; label: string; icon: string }[] = [
  { id: 'kana',    label: '五十音', icon: 'あ' },
  { id: 'vocab',   label: '單字',   icon: '語' },
  { id: 'grammar', label: '文法',   icon: '文' },
]

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
    // 五十音允許捲動
    <div className="h-full overflow-y-auto pb-4">
      <div className="flex items-center gap-3 flex-wrap pb-4">
        <div className="flex gap-2">
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

function LevelSelector({
  allCards, level, onChange, color,
}: {
  allCards: { level: string }[]
  level: JlptLevel
  onChange: (l: JlptLevel) => void
  color: 'indigo' | 'teal'
}) {
  const active = {
    indigo: 'bg-indigo-600 text-white',
    teal:   'bg-teal-600 text-white',
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
  const [level, setLevel] = useState<JlptLevel>('N5')
  const cards = filterVocab(allCards, level)
  return (
    <div className="h-full flex flex-col">
      <div className="shrink-0 pb-3">
        <LevelSelector allCards={allCards} level={level} onChange={setLevel} color="indigo" />
      </div>
      <div className="flex-1 min-h-0">
        {cards.length > 0 ? <VocabStudy cards={cards} /> : <EmptyLevel level={level} />}
      </div>
    </div>
  )
}

function GrammarSection({ allCards }: { allCards: GrammarCard[] }) {
  const [level, setLevel] = useState<JlptLevel>('N5')
  const cards = filterGrammar(allCards, level)
  return (
    <div className="h-full flex flex-col">
      <div className="shrink-0 pb-3">
        <LevelSelector allCards={allCards} level={level} onChange={setLevel} color="teal" />
      </div>
      <div className="flex-1 min-h-0">
        {cards.length > 0 ? <GrammarStudy cards={cards} /> : <EmptyLevel level={level} />}
      </div>
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
    <div className="h-full flex flex-col pb-16 md:pb-0">
      {/* 頁首 */}
      <div className="shrink-0 pt-4 pb-2 pr-10 md:pr-0">
        <h1 className="text-xl font-semibold tracking-tight">學習</h1>
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
        {subject === 'kana'    && <KanaSection />}
        {subject === 'vocab'   && <VocabSection allCards={vocabCards} />}
        {subject === 'grammar' && <GrammarSection allCards={grammarCards} />}
      </div>
    </div>
  )
}
