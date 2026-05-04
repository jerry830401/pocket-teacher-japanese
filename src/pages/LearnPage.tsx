import { useState, useEffect, useMemo } from 'react'
import type { KanaChar, KanaGroup } from '@/features/kana/types'
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
import KanaStudy from '@/features/kana/components/KanaStudy'
import BreadcrumbHeader from '@/shared/BreadcrumbHeader'
import TeacherBubble from '@/shared/TeacherBubble'
import { HOME_HINTS } from '@/shared/teacherHints'

type JlptLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1'
const JLPT_LEVELS: JlptLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1']

// ── Category definitions ──────────────────────────────────────────────────────

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

interface NavState {
  subject: 'hiragana' | 'katakana' | 'vocab' | 'grammar' | null
  sub: string | null
  catId: string | null
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
    parts.push(sub)
    if (catId) {
      const cats = subject === 'vocab' ? VOCAB_CATS : GRAMMAR_CATS
      parts.push(cats.find(c => c.id === catId)?.label ?? catId)
    }
  }
  return parts
}

// ── Pixel drill item ──────────────────────────────────────────────────────────

function DrillItem({
  label, badge, disabled, coming, onClick,
}: {
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
      className="w-full flex items-center gap-3 text-left pcard-tap"
      style={{
        background: disabled ? 'var(--color-cream-2)' : 'var(--color-paper)',
        border: '2.5px solid var(--color-ink)',
        boxShadow: disabled ? 'none' : '2px 2px 0 var(--color-ink)',
        padding: '12px 14px',
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: 'system-ui, sans-serif',
        fontWeight: 700,
        fontSize: '0.9375rem',
        color: 'var(--color-ink)',
      }}
    >
      <span style={{ flex: 1 }}>{label}</span>
      {coming && (
        <span className="ptag" style={{ fontSize: '0.625rem', padding: '2px 5px' }}>即將推出</span>
      )}
      {badge !== undefined && (
        <span style={{
          fontFamily: '"VT323", monospace',
          fontSize: '1.5rem',
          color: 'var(--color-ink-soft)',
          lineHeight: 1,
        }}>{badge}</span>
      )}
      {!disabled && (
        <span style={{
          fontFamily: 'system-ui, sans-serif',
          fontSize: '1.5rem',
          color: 'var(--color-ink-soft)',
        }}>→</span>
      )}
    </button>
  )
}

// ── List screens ──────────────────────────────────────────────────────────────

// Subject tiles — 2×2 pixel card grid
const TILE_STYLE: Record<string, { bg: string; char: string; label: string }> = {
  hiragana: { bg: 'var(--color-paper)',     char: 'あ', label: '平假名' },
  katakana: { bg: 'var(--color-indigo-px-soft)', char: 'ア', label: '片假名' },
  vocab:    { bg: 'var(--color-sakura-soft)', char: '語', label: '單字' },
  grammar:  { bg: 'var(--color-matcha-soft)', char: '文', label: '文法' },
}

function SubjectScreen({
  onSelect,
}: {
  onSelect: (s: 'hiragana' | 'katakana' | 'vocab' | 'grammar') => void
}) {
  const ids = ['hiragana', 'katakana', 'vocab', 'grammar'] as const
  const hint = HOME_HINTS[Math.floor(Math.random() * HOME_HINTS.length)]
  return (
    <div className="h-full overflow-y-auto" style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 12 }}>
      <TeacherBubble hint={hint} mood="cheer" />
      <div className="px-topic-grid">
        {ids.map(id => {
          const t = TILE_STYLE[id]
          return (
            <div
              key={id}
              className="px-topic"
              style={{ background: t.bg }}
              onClick={() => onSelect(id)}
            >
              <span className="kana" style={{ fontSize: '2.25rem', lineHeight: 1, fontWeight: 900 }}>{t.char}</span>
              <span style={{ fontFamily: 'system-ui, sans-serif', fontSize: '1rem', lineHeight: 1.4 }}>
                {t.label}
              </span>
            </div>
          )
        })}
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
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
  const LEVEL_BG: Record<string, string> = {
    N5: 'var(--color-matcha-soft)',
    N4: 'var(--color-paper)',
    N3: 'var(--color-sakura-soft)',
    N2: 'var(--color-indigo-px-soft)',
    N1: 'var(--color-cream)',
  }
  return (
    <div className="h-full overflow-y-auto">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {JLPT_LEVELS.map((level) => {
          const count = allCards.filter(c => c.level === level).length
          const available = count > 0
          return (
            <button
              key={level}
              disabled={!available}
              onClick={() => { if (available) onSelect(level) }}
              className="pcard-tap"
              style={{
                background: available ? LEVEL_BG[level] : 'var(--color-cream-2)',
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
                width: 48, height: 48,
                border: '3px solid var(--color-ink)',
                background: 'var(--color-paper)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'system-ui, sans-serif',
                fontSize: '0.875rem',
                color: 'var(--color-ink)',
                flexShrink: 0,
              }}>{level}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'system-ui, sans-serif', fontSize: '1rem', lineHeight: 1.4 }}>
                  {level} {level === 'N5' ? '· 入門' : level === 'N4' ? '· 初級' : level === 'N3' ? '· 中級' : level === 'N2' ? '· 中高' : '· 高級'}
                </div>
                {available
                  ? <div style={{ fontFamily: '"VT323", monospace', fontSize: '1.375rem', color: 'var(--color-ink-soft)', marginTop: 2 }}>{count} 個</div>
                  : <div style={{ fontFamily: '"VT323", monospace', fontSize: '1.375rem', color: 'var(--color-ink-faint)', marginTop: 2 }}>即將推出</div>
                }
              </div>
              {available && <span style={{ fontFamily: 'system-ui, sans-serif', fontSize: '1.5rem', color: 'var(--color-ink-soft)' }}>→</span>}
            </button>
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {VOCAB_CATS.map(({ id, label, tags, pos }) => {
          const count = filterVocabCat(levelCards, tags, pos).length
          if (count === 0) return null
          return <DrillItem key={id} label={label} badge={count} onClick={() => onSelect(id)} />
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {GRAMMAR_CATS.map(({ id, label, tags }) => {
          const count = tags === null
            ? levelCards.length
            : levelCards.filter(c => c.tags.some(t => tags.includes(t))).length
          if (count === 0) return null
          return <DrillItem key={id} label={label} badge={count} onClick={() => onSelect(id)} />
        })}
      </div>
    </div>
  )
}

// ── Content screens ───────────────────────────────────────────────────────────

function VocabCategoryContent({ level, catId, allCards }: {
  level: JlptLevel; catId: string; allCards: VocabCard[]
}) {
  const cat = VOCAB_CATS.find(c => c.id === catId)!
  const cards = useMemo(() => {
    const byLevel = allCards.filter(c => c.level === level)
    return filterVocabCat(byLevel, cat.tags, cat.pos)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allCards, level, catId])
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 min-h-0 flex flex-col">
        {cards.length > 0
          ? <VocabStudy cards={cards} />
          : <p style={{ color: 'var(--color-ink-soft)', fontSize: '0.875rem' }}>此分類暫無資料。</p>
        }
      </div>
    </div>
  )
}

function GrammarCategoryContent({ level, catId, allCards }: {
  level: JlptLevel; catId: string; allCards: GrammarCard[]
}) {
  const cat = GRAMMAR_CATS.find(c => c.id === catId)!
  const cards = useMemo(() => {
    const byLevel = allCards.filter(c => c.level === level)
    return cat.tags === null ? byLevel : byLevel.filter(c => c.tags.some(t => cat.tags!.includes(t)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allCards, level, catId])
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 min-h-0 flex flex-col">
        {cards.length > 0
          ? <GrammarStudy cards={cards} />
          : <p style={{ color: 'var(--color-ink-soft)', fontSize: '0.875rem' }}>此分類暫無資料。</p>
        }
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LearnPage() {
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
      return <SubjectScreen onSelect={(s) => setNav({ subject: s, sub: null, catId: null })} />
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
      return <KanaStudy kanaType={subject} group={sub as KanaGroup} allChars={kanaChars} />
    }

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
      return <VocabCategoryContent level={sub as JlptLevel} catId={catId} allCards={vocabCards} />
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
    return <GrammarCategoryContent level={sub as JlptLevel} catId={catId} allCards={grammarCards} />
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 頁首 */}
      <BreadcrumbHeader
        title={breadcrumb[0]}
        crumbs={breadcrumb.slice(1)}
        canGoBack={canGoBack}
        onBack={back}
      />

      {error && (
        <p style={{ color: '#c8633a', fontSize: '0.8125rem', padding: '0 16px 8px', flexShrink: 0 }}>{error}</p>
      )}

      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', padding: '0 16px 8px', display: 'flex', flexDirection: 'column' }}>
        {renderScreen()}
      </div>
    </div>
  )
}
