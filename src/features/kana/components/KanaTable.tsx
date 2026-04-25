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
    <div className="space-y-10">
      <Section title="清音" grid={mainGrid} showRomaji={showRomaji} />
      <Section title="濁音・半濁音" grid={dakutenGrid} showRomaji={showRomaji} />
    </div>
  )
}

// 響應式尺寸常數，集中在一處方便調整
// 手機：格子 44px，標籤 32px，gap 8px → 總寬 32+5×44+5×8 = 292px < 343px ✓
// 桌機：格子 56px，標籤 48px，gap 12px → 總寬 48+5×56+5×12 = 388px
const CELL = 'w-11 h-11 md:w-14 md:h-14'
const LABEL = 'w-8 md:w-12'
const GAP = 'gap-2 md:gap-3'

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
    <div className="space-y-3">
      <h3 className="text-xs font-semibold tracking-widest text-slate-400 dark:text-slate-500 uppercase">
        {title}
      </h3>

      {/* overflow-x-auto 保險；w-fit mx-auto 讓表格置中 */}
      <div className="overflow-x-auto pb-1">
        <div className="w-fit mx-auto">
          {/* 欄首（a i u e o）*/}
          <div className={`flex items-center ${GAP} mb-1`}>
            <span className={`${LABEL} shrink-0`} />
            {VOWEL_ORDER.map((v) => (
              <span
                key={v}
                className={`${CELL} shrink-0 flex items-center justify-center text-xs font-medium text-slate-400 dark:text-slate-500`}
              >
                {v}
              </span>
            ))}
          </div>

          {/* 每一行 */}
          <div className="space-y-2 md:space-y-2.5">
            {grid.map(({ label, cells, single }) => (
              <div key={label} className={`flex items-center ${GAP}`}>
                <span className={`${LABEL} shrink-0 text-right text-[11px] md:text-xs text-slate-400 dark:text-slate-500 pr-0.5`}>
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
    return <span className={`${CELL} shrink-0`} />
  }

  return (
    <div className={`${CELL} shrink-0 flex flex-col items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-colors cursor-default select-none`}>
      <span className="text-lg md:text-xl leading-none">{char.kana}</span>
      {showRomaji && (
        <span className="text-[9px] md:text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
          {char.romaji}
        </span>
      )}
    </div>
  )
}
