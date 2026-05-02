import { useSettings, QUIZ_ROUND_OPTIONS, type QuizRoundSize, type QuizKey, type MascotKind, type CatVariant } from '@/stores/useSettings'
import OfflineDataButton from '@/features/progress/OfflineDataButton'
import { isPwa } from '@/lib/pwa'
import Mascot from '@/shared/Mascot'

const ITEMS: { key: QuizKey; label: string }[] = [
  { key: 'kana',      label: '五十音' },
  { key: 'vocab',     label: '單字'   },
  { key: 'grammar',   label: '文法'   },
  { key: 'listening', label: '聽力'   },
]

const CAT_VARIANTS: { id: CatVariant; label: string }[] = [
  { id: 'black',  label: '黑貓'   },
  { id: 'tuxedo', label: '賓士貓' },
  { id: 'calico', label: '三花貓' },
  { id: 'orange', label: '橘貓'   },
]

function PxToggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={['px-toggle', checked ? 'on' : ''].join(' ')}
      style={{ cursor: 'pointer' }}
    >
      <div className="px-toggle-thumb" />
    </div>
  )
}

export default function SettingsPage() {
  const {
    autoNextKana, autoNextVocab, autoNextGrammar, autoNextListening, setAutoNext,
    roundSizeKana, roundSizeVocab, roundSizeGrammar, roundSizeListening, setRoundSize,
    mascotKind, catVariant, setMascotKind, setCatVariant,
  } = useSettings()

  const autoNextValues: Record<QuizKey, boolean> = {
    kana:      autoNextKana,
    vocab:     autoNextVocab,
    grammar:   autoNextGrammar,
    listening: autoNextListening,
  }
  const roundSizeValues: Record<QuizKey, QuizRoundSize> = {
    kana:      roundSizeKana,
    vocab:     roundSizeVocab,
    grammar:   roundSizeGrammar,
    listening: roundSizeListening,
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '0 16px 16px' }}>
      {/* 頁首 */}
      <div style={{ padding: '14px 0 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 11, lineHeight: 1.4 }}>設定</span>
        <span style={{ fontFamily: '"VT323", monospace', fontSize: 16, color: 'var(--color-ink-soft)' }}>v1.0</span>
      </div>

      {/* 老師角色 */}
      <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 8, color: 'var(--color-ink-soft)', marginBottom: 8, letterSpacing: 1 }}>老師</div>
      <div className="px-settings-list" style={{ marginBottom: 18 }}>
        <div className="px-settings-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>角色</span>
            <span style={{ fontFamily: '"VT323", monospace', fontSize: 16, color: 'var(--color-ink-soft)' }}>
              {mascotKind === 'cat' ? '招財貓' : '柴犬'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['cat', 'shiba'] as MascotKind[]).map((k) => (
              <button
                key={k}
                className={['pbtn', 'flex-1', mascotKind === k ? 'pbtn-primary' : ''].join(' ')}
                style={{ padding: '8px 4px', fontSize: 13 }}
                onClick={() => setMascotKind(k)}
              >
                {k === 'cat' ? '招財貓' : '柴犬'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 貓咪花色 */}
      {mascotKind === 'cat' && (
        <>
          <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 8, color: 'var(--color-ink-soft)', marginBottom: 8, letterSpacing: 1 }}>貓咪花色</div>
          <div className="px-cat-grid" style={{ marginBottom: 18 }}>
            {CAT_VARIANTS.map((v) => {
              const selected = catVariant === v.id
              return (
                <div
                  key={v.id}
                  className={['px-cat-pick', selected ? 'selected' : ''].join(' ')}
                  onClick={() => setCatVariant(v.id)}
                >
                  <div className="px-cat-pick-frame">
                    <Mascot kind="cat" variant={v.id} mood="idle" size={3} />
                  </div>
                  <span style={{ fontFamily: '"Zen Maru Gothic", sans-serif', fontWeight: 700, fontSize: 13 }}>
                    {v.label}
                  </span>
                  {selected && (
                    <div className="px-cat-pick-check">✓</div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* 答對自動下一題 */}
      <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 8, color: 'var(--color-ink-soft)', marginBottom: 8, letterSpacing: 1 }}>答對自動下一題</div>
      <div className="px-settings-list" style={{ marginBottom: 18 }}>
        {ITEMS.map(({ key, label }) => (
          <div key={key} className="px-settings-row">
            <span>{label}</span>
            <PxToggle checked={autoNextValues[key]} onChange={(v) => setAutoNext(key, v)} />
          </div>
        ))}
      </div>

      {/* 每輪題數 */}
      <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 8, color: 'var(--color-ink-soft)', marginBottom: 8, letterSpacing: 1 }}>每輪題數</div>
      <div className="px-settings-list" style={{ marginBottom: 18 }}>
        {ITEMS.map(({ key, label }) => (
          <div key={key} className="px-settings-row">
            <span>{label}</span>
            <div style={{ display: 'flex', gap: 4 }}>
              {QUIZ_ROUND_OPTIONS.map((n) => (
                <button
                  key={n}
                  onClick={() => setRoundSize(key, n)}
                  style={{
                    width: 36,
                    padding: '5px 0',
                    border: '2px solid var(--color-ink)',
                    background: roundSizeValues[key] === n ? 'var(--color-gold)' : 'var(--color-paper)',
                    fontFamily: '"Press Start 2P", monospace',
                    fontSize: 9,
                    cursor: 'pointer',
                    fontWeight: 700,
                    color: 'var(--color-ink)',
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 離線 */}
      {isPwa() && (
        <>
          <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 8, color: 'var(--color-ink-soft)', marginBottom: 8, letterSpacing: 1 }}>離線</div>
          <OfflineDataButton />
        </>
      )}
    </div>
  )
}
