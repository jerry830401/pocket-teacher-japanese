import type { KanaChar } from '../types'
import { GOJUUON_ROW_ORDER, DAKUTEN_ROW_ORDER } from '../data'

const VOWEL_ORDER = ['a', 'i', 'u', 'e', 'o']

type RowDef = typeof GOJUUON_ROW_ORDER[number]

function buildGrid(chars: KanaChar[], rows: readonly RowDef[]) {
  return rows.map(({ label, group }) => {
    const rowChars = chars.filter((c) => c.group === group)

    if (group === 'n-char') {
      return { label, cells: [rowChars[0] ?? null] as (KanaChar | null)[], single: true }
    }

    const cells = VOWEL_ORDER.map(
      (v) => rowChars.find((c) => c.romaji === v || c.romaji.endsWith(v)) ?? null,
    )
    return { label, cells, single: false }
  })
}

interface Props {
  chars: KanaChar[]
  showRomaji: boolean
}

export default function KanaTable({ chars, showRomaji }: Props) {
  const mainGrid = buildGrid(chars, GOJUUON_ROW_ORDER)
  const dakutenGrid = buildGrid(chars, DAKUTEN_ROW_ORDER)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <Section title="清音" grid={mainGrid} showRomaji={showRomaji} />
      <Section title="濁音・半濁音" grid={dakutenGrid} showRomaji={showRomaji} />
    </div>
  )
}

function Section({
  title,
  grid,
  showRomaji,
}: {
  title: string
  grid: ReturnType<typeof buildGrid>
  showRomaji: boolean
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <span style={{
        fontFamily: 'system-ui, sans-serif',
        fontSize: '1rem',
        color: 'var(--color-ink-soft)',
        letterSpacing: '0.15em',
      }}>
        {title}
      </span>

      <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
        <div style={{ width: 'fit-content', margin: '0 auto' }}>
          {/* 欄首 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span style={{ width: 32, flexShrink: 0 }} />
            {VOWEL_ORDER.map((v) => (
              <span
                key={v}
                style={{
                  width: 48,
                  height: 48,
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: '"VT323", monospace',
                  fontSize: '1.375rem',
                  color: 'var(--color-ink-soft)',
                }}
              >
                {v}
              </span>
            ))}
          </div>

          {/* 每一行 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {grid.map(({ label, cells, single }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{
                  width: 32,
                  flexShrink: 0,
                  textAlign: 'right',
                  fontFamily: '"VT323", monospace',
                  fontSize: '0.8125rem',
                  color: 'var(--color-ink-soft)',
                  paddingRight: 2,
                }}>
                  {label}
                </span>
                {single ? (
                  <KanaCell char={cells[0]} showRomaji={showRomaji} />
                ) : (
                  cells.map((char, i) => (
                    <KanaCell key={i} char={char} showRomaji={showRomaji} />
                  ))
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function KanaCell({ char, showRomaji }: { char: KanaChar | null; showRomaji: boolean }) {
  if (!char) {
    return <span style={{ width: 48, height: 48, flexShrink: 0 }} />
  }

  return (
    <div style={{
      width: 48,
      height: 48,
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      border: '2px solid var(--color-ink)',
      background: 'var(--color-paper)',
      cursor: 'default',
      userSelect: 'none',
      transition: 'background 0.1s',
    }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-indigo-px-soft)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--color-paper)')}
    >
      <span style={{ fontFamily: '"DotGothic16", "Zen Maru Gothic", sans-serif', fontWeight: 700, fontSize: '1.125rem', lineHeight: 1 }}>
        {char.kana}
      </span>
      {showRomaji && (
        <span style={{ fontFamily: '"VT323", monospace', fontSize: '0.75rem', color: 'var(--color-ink-soft)', marginTop: 1 }}>
          {char.romaji}
        </span>
      )}
    </div>
  )
}
