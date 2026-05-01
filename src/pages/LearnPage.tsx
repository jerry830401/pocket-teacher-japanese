import { useState, useEffect, useMemo } from 'react'
import type { KanaChar, KanaType, KanaGroup } from '@/features/kana/types'
import type { VocabCard } from '@/features/vocabulary/types'
import type { GrammarCard } from '@/features/grammar/types'
import {
  loadKana,
  filterByType,
  filterByGroup,
  GOJUUON_ROW_ORDER,
  DAKUTEN_ROW_ORDER,
} from '@/features/kana/data'
import { loadVocabulary } from '@/features/vocabulary/data'
import { loadGrammar } from '@/features/grammar/data'
import VocabStudy from '@/features/vocabulary/components/VocabStudy'
import GrammarStudy from '@/features/grammar/components/GrammarStudy'

type JlptLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1'
const JLPT_LEVELS: JlptLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1']

// ── Category definitions ──────────────────────────────────────────────────────

// filter: null = 全部；tags = 任意一個 tag 符合；pos = payload.pos 符合
const VOCAB_CATS: Array<{ id: string; label: string; tags: string[] | null; pos: string[] | null }> = [
  { id: 'all',        label: '全部',         tags: null,                                          pos: null },
  { id: 'greeting',   label: '問候・表達',   tags: ['greeting', 'question'],                      pos: null },
  { id: 'person',     label: '人物・家族',   tags: ['person', 'family'],                          pos: null },
  { id: 'number',     label: '數字・助數詞', tags: ['number'],                                    pos: null },
  { id: 'time',       label: '時間・日期',   tags: ['time'],                                      pos: null },
  { id: 'place',      label: '場所・方向',   tags: ['place', 'direction'],                        pos: null },
  { id: 'food',       label: '食物・飲料',   tags: ['food'],                                      pos: null },
  { id: 'body',       label: '身體・健康',   tags: ['body', 'health'],                            pos: null },
  { id: 'home',       label: '家・物品',     tags: ['home', 'clothing'],                          pos: null },
  { id: 'nature',     label: '自然・動物',   tags: ['nature', 'animal', 'weather'],               pos: null },
  { id: 'transport',  label: '交通・移動',   tags: ['transport'],                                 pos: null },
  { id: 'school',     label: '學校・工作',   tags: ['school', 'work'],                            pos: null },
  { id: 'emotion',    label: '情感・色彩',   tags: ['emotion', 'color', 'size'],                  pos: null },
  { id: 'verb',       label: '動詞',         tags: null,                                          pos: ['verb'] },
  { id: 'adjective',  label: '形容詞',       tags: null,                                          pos: ['i-adj', 'na-adj'] },
  { id: 'adverb',     label: '副詞・接續',   tags: null,                                          pos: ['adverb'] },
]

function filterVocabCat(
  cards: VocabCard[],
  tags: string[] | null,
  pos: string[] | null,
): VocabCard[] {
  if (tags === null && pos === null) return cards
  return cards.filter(c => {
    if (tags !== null && c.tags.some(t => tags.includes(t))) return true
    if (pos  !== null && pos.includes(c.payload.pos))        return true
    return false
  })
}

const GRAMMAR_CATS: Array<{ id: string; label: string; tags: string[] | null }> = [
  { id: 'all',         label: '全部',       tags: null },
  { id: 'particle',    label: '助詞',       tags: ['particle'] },
  { id: 'verb-form',   label: '動詞文法',   tags: ['verb-ending', 'te-form', 'ています', 'できる', 'たい', 'てください', 'ておく', 'てみる', 'てから', 'ながら', 'past', 'already'] },
  { id: 'conditional', label: '條件・假定', tags: ['conditional', 'たら'] },
  { id: 'obligation',  label: '義務・許可', tags: ['obligation', 'permission', 'prohibition'] },
  { id: 'adjective',   label: '形容詞文法', tags: ['na-adjective', 'i-adjective', '上手', '下手'] },
  { id: 'adverb',      label: '副詞・接續', tags: ['adverb', 'conjunction'] },
  { id: 'existence',   label: '存在・其他', tags: ['existence', 'copula'] },
]

// ── Navigation state ──────────────────────────────────────────────────────────
//
// Drill path:
//   kana:          subject → sub (KanaGroup) → content
//   vocab/grammar: subject → sub (JlptLevel) → catId → content

interface NavState {
  subject: 'hiragana' | 'katakana' | 'vocab' | 'grammar' | null
  sub: string | null   // KanaGroup for kana; JlptLevel for vocab/grammar
  catId: string | null // vocab/grammar category id
}

const NAV_INIT: NavState = { subject: null, sub: null, catId: null }

function navBack(nav: NavState): NavState {
  if (nav.catId !== null) return { ...nav, catId: null }
  if (nav.sub   !== null) return { ...nav, sub: null }
  return NAV_INIT
}

const ALL_ROWS = [...GOJUUON_ROW_ORDER, ...DAKUTEN_ROW_ORDER]

function getBreadcrumb(nav: NavState): string[] {
  const { subject, sub, catId } = nav
  const parts = ['學習']
  if (!subject) return parts

  if (subject === 'hiragana') parts.push('平假名')
  else if (subject === 'katakana') parts.push('片假名')
  else if (subject === 'vocab') parts.push('單字')
  else parts.push('文法')

  if (!sub) return parts

  if (subject === 'hiragana' || subject === 'katakana') {
    parts.push(ALL_ROWS.find(r => r.group === sub)?.label ?? sub)
  } else {
    parts.push(sub) // JlptLevel
    if (catId) {
      const cats = subject === 'vocab' ? VOCAB_CATS : GRAMMAR_CATS
      parts.push(cats.find(c => c.id === catId)?.label ?? catId)
    }
  }

  return parts
}

// ── Shared UI ─────────────────────────────────────────────────────────────────

function DrillItem({
  icon, label, badge, disabled, coming, onClick,
}: {
  icon?: string
  label: string
  badge?: number
  disabled?: boolean
  coming?: boolean
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={[
        'w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left border transition-colors',
        disabled
          ? 'bg-slate-50 dark:bg-slate-900/40 border-slate-100 dark:border-slate-800 text-slate-300 dark:text-slate-600 cursor-not-allowed'
          : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800',
      ].join(' ')}
    >
      {icon && <span className="text-xl w-7 text-center shrink-0 leading-none">{icon}</span>}
      <span className="flex-1 font-medium">{label}</span>
      {coming && (
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500">
          即將推出
        </span>
      )}
      {badge !== undefined && (
        <span className="text-sm tabular-nums text-slate-400 dark:text-slate-500">{badge}</span>
      )}
      {!disabled && (
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0 text-slate-300 dark:text-slate-600">
          <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
        </svg>
      )}
    </button>
  )
}

// ── List screens ──────────────────────────────────────────────────────────────

function SubjectScreen({
  onSelect,
}: {
  onSelect: (s: 'hiragana' | 'katakana' | 'vocab' | 'grammar') => void
}) {
  const tiles = [
    { id: 'hiragana', label: '平假名', icon: 'あ', cls: 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/50' },
    { id: 'katakana', label: '片假名', icon: 'ア', cls: 'bg-violet-50 dark:bg-violet-950/40 border-violet-200 dark:border-violet-800 hover:bg-violet-100 dark:hover:bg-violet-900/50' },
    { id: 'vocab',    label: '單字',   icon: '語', cls: 'bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800 hover:bg-teal-100 dark:hover:bg-teal-900/50' },
    { id: 'grammar',  label: '文法',   icon: '文', cls: 'bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-900/50' },
  ] as const

  return (
    <div className="h-full overflow-y-auto">
      <div className="grid grid-cols-2 gap-3">
        {tiles.map(({ id, label, icon, cls }) => (
          <button
            key={id}
            onClick={() => onSelect(id)}
            className={`flex flex-col items-center justify-center gap-2 py-10 rounded-2xl border-2 transition-all active:scale-95 ${cls}`}
          >
            <span className="text-4xl leading-none">{icon}</span>
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function KanaRowsScreen({
  kanaType, kanaChars, onSelect,
}: {
  kanaType: 'hiragana' | 'katakana'
  kanaChars: KanaChar[]
  onSelect: (group: KanaGroup) => void
}) {
  const typeChars = filterByType(kanaChars, kanaType)

  return (
    <div className="h-full overflow-y-auto">
      <div className="space-y-2">
        {ALL_ROWS.map(({ label, group }) => {
          const count = filterByGroup(typeChars, group).length
          if (count === 0) return null
          return (
            <DrillItem
              key={group}
              label={label}
              badge={count}
              onClick={() => onSelect(group as KanaGroup)}
            />
          )
        })}
      </div>
    </div>
  )
}

function LevelsScreen({
  subject, vocabCards, grammarCards, onSelect,
}: {
  subject: 'vocab' | 'grammar'
  vocabCards: VocabCard[]
  grammarCards: GrammarCard[]
  onSelect: (l: JlptLevel) => void
}) {
  const allCards = subject === 'vocab' ? vocabCards : grammarCards

  return (
    <div className="h-full overflow-y-auto">
      <div className="space-y-2">
        {JLPT_LEVELS.map((level) => {
          const count = allCards.filter(c => c.level === level).length
          const available = count > 0
          return (
            <DrillItem
              key={level}
              label={level}
              badge={available ? count : undefined}
              disabled={!available}
              coming={!available}
              onClick={() => { if (available) onSelect(level) }}
            />
          )
        })}
      </div>
    </div>
  )
}

function VocabCategoriesScreen({
  level, vocabCards, onSelect,
}: {
  level: JlptLevel
  vocabCards: VocabCard[]
  onSelect: (catId: string) => void
}) {
  const levelCards = vocabCards.filter(c => c.level === level)

  return (
    <div className="h-full overflow-y-auto">
      <div className="space-y-2">
        {VOCAB_CATS.map(({ id, label, tags, pos }) => {
          const count = filterVocabCat(levelCards, tags, pos).length
          if (count === 0) return null
          return (
            <DrillItem key={id} label={label} badge={count} onClick={() => onSelect(id)} />
          )
        })}
      </div>
    </div>
  )
}

function GrammarCategoriesScreen({
  level, grammarCards, onSelect,
}: {
  level: JlptLevel
  grammarCards: GrammarCard[]
  onSelect: (catId: string) => void
}) {
  const levelCards = grammarCards.filter(c => c.level === level)

  return (
    <div className="h-full overflow-y-auto">
      <div className="space-y-2">
        {GRAMMAR_CATS.map(({ id, label, tags }) => {
          const count = tags === null
            ? levelCards.length
            : levelCards.filter(c => c.tags.some(t => tags.includes(t))).length
          if (count === 0) return null
          return (
            <DrillItem key={id} label={label} badge={count} onClick={() => onSelect(id)} />
          )
        })}
      </div>
    </div>
  )
}

// ── Content screens ───────────────────────────────────────────────────────────

function KanaRowContent({
  kanaType, group, allChars,
}: {
  kanaType: KanaType
  group: KanaGroup
  allChars: KanaChar[]
}) {
  const chars = useMemo(
    () => filterByGroup(filterByType(allChars, kanaType), group).sort((a, b) => a.order - b.order),
    [allChars, kanaType, group],
  )

  return (
    <div className="h-full overflow-y-auto pb-4">
      <div className="space-y-3">
        {chars.map(char => (
          <div
            key={char.id}
            className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm overflow-hidden"
          >
            {/* 假名 + 羅馬拼音 */}
            <div className="flex items-center gap-4 px-5 pt-4 pb-3">
              <span className="text-5xl leading-none font-light tracking-tight text-slate-900 dark:text-slate-100 w-14 text-center shrink-0">
                {char.kana}
              </span>
              <span className="text-lg text-slate-400 dark:text-slate-500 font-mono">{char.romaji}</span>
            </div>

            {/* 代表單字 + 例句 */}
            {char.word && (
              <div className="border-t border-slate-100 dark:border-slate-800 px-5 py-3 space-y-1.5">
                <div className="flex items-baseline gap-2">
                  <span className="text-base font-semibold text-slate-800 dark:text-slate-200">{char.word.word}</span>
                  {char.word.word !== char.word.reading && (
                    <span className="text-sm text-slate-400 dark:text-slate-500">（{char.word.reading}）</span>
                  )}
                  <span className="text-sm text-indigo-600 dark:text-indigo-400 ml-auto shrink-0">{char.word.meaning}</span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">{char.word.sentence}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">{char.word.sentence_meaning}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function VocabCategoryContent({
  level, catId, allCards,
}: {
  level: JlptLevel
  catId: string
  allCards: VocabCard[]
}) {
  const cat = VOCAB_CATS.find(c => c.id === catId)!
  const cards = useMemo(() => {
    const byLevel = allCards.filter(c => c.level === level)
    return filterVocabCat(byLevel, cat.tags, cat.pos)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allCards, level, catId])

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 min-h-0">
        {cards.length > 0
          ? <VocabStudy cards={cards} />
          : <p className="text-sm text-slate-500">此分類暫無資料。</p>
        }
      </div>
    </div>
  )
}

function GrammarCategoryContent({
  level, catId, allCards,
}: {
  level: JlptLevel
  catId: string
  allCards: GrammarCard[]
}) {
  const cat = GRAMMAR_CATS.find(c => c.id === catId)!
  const cards = useMemo(() => {
    const byLevel = allCards.filter(c => c.level === level)
    return cat.tags === null ? byLevel : byLevel.filter(c => c.tags.some(t => cat.tags!.includes(t)))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allCards, level, catId])

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 min-h-0">
        {cards.length > 0
          ? <GrammarStudy cards={cards} />
          : <p className="text-sm text-slate-500">此分類暫無資料。</p>
        }
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LearnPageV2() {
  const [kanaChars,    setKanaChars]    = useState<KanaChar[]>([])
  const [vocabCards,   setVocabCards]   = useState<VocabCard[]>([])
  const [grammarCards, setGrammarCards] = useState<GrammarCard[]>([])
  const [nav,          setNav]          = useState<NavState>(NAV_INIT)
  const [error,        setError]        = useState<string | null>(null)

  useEffect(() => {
    Promise.all([loadKana(), loadVocabulary(), loadGrammar()])
      .then(([kana, vocab, grammar]) => {
        setKanaChars(kana)
        setVocabCards(vocab)
        setGrammarCards(grammar)
      })
      .catch(() => setError('資料載入失敗，請重新整理頁面'))
  }, [])

  const back = () => setNav(n => navBack(n))
  const breadcrumb = getBreadcrumb(nav)
  const canGoBack = nav.subject !== null

  function renderScreen() {
    const { subject, sub, catId } = nav

    if (!subject) {
      return (
        <SubjectScreen onSelect={(s) => setNav({ subject: s, sub: null, catId: null })} />
      )
    }

    if (subject === 'hiragana' || subject === 'katakana') {
      if (!sub) {
        return (
          <KanaRowsScreen
            kanaType={subject}
            kanaChars={kanaChars}
            onSelect={(group) => setNav({ ...nav, sub: group })}
          />
        )
      }
      return (
        <KanaRowContent
          kanaType={subject}
          group={sub as KanaGroup}
          allChars={kanaChars}
        />
      )
    }

    // vocab or grammar
    if (!sub) {
      return (
        <LevelsScreen
          subject={subject}
          vocabCards={vocabCards}
          grammarCards={grammarCards}
          onSelect={(level) => setNav({ ...nav, sub: level })}
        />
      )
    }

    if (subject === 'vocab') {
      if (!catId) {
        return (
          <VocabCategoriesScreen
            level={sub as JlptLevel}
            vocabCards={vocabCards}
            onSelect={(id) => setNav({ ...nav, catId: id })}
          />
        )
      }
      return (
        <VocabCategoryContent
          level={sub as JlptLevel}
          catId={catId}
          allCards={vocabCards}
        />
      )
    }

    // grammar
    if (!catId) {
      return (
        <GrammarCategoriesScreen
          level={sub as JlptLevel}
          grammarCards={grammarCards}
          onSelect={(id) => setNav({ ...nav, catId: id })}
        />
      )
    }
    return (
      <GrammarCategoryContent
        level={sub as JlptLevel}
        catId={catId}
        allCards={grammarCards}
      />
    )
  }

  return (
    <div className="h-full flex flex-col pb-16 md:pb-0">
      {/* 頁首：麵包屑 + 右上返回 */}
      <div className="shrink-0 pt-4 pb-3 flex items-center gap-2">
        <h1 className="flex-1 min-w-0 text-base font-semibold tracking-tight truncate text-slate-900 dark:text-slate-100">
          {breadcrumb.join(' - ')}
        </h1>
        {canGoBack && (
          <button
            onClick={back}
            className="shrink-0 flex items-center gap-1 text-sm text-indigo-600 dark:text-indigo-400"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
            </svg>
            返回
          </button>
        )}
      </div>

      {error && <p className="shrink-0 text-sm text-red-500 pb-2">{error}</p>}

      <div className="flex-1 min-h-0">
        {renderScreen()}
      </div>
    </div>
  )
}
