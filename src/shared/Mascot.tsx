import type { CatVariant, MascotKind } from '@/stores/useSettings'

export type MascotMood = 'idle' | 'happy' | 'sad' | 'cheer'

// ── Pixel grid renderer ────────────────────────────────────────────────────────
interface PGProps {
  grid: string[]
  palette: Record<string, string>
  size?: number
  style?: React.CSSProperties
}

function PG({ grid, palette, size = 4, style }: PGProps) {
  const h = grid.length
  const w = grid[0].length
  return (
    <svg
      width={w * size}
      height={h * size}
      viewBox={`0 0 ${w} ${h}`}
      shapeRendering="crispEdges"
      style={{ imageRendering: 'pixelated', display: 'block', ...style }}
    >
      {grid.flatMap((row, y) =>
        row.split('').map((ch, x) => {
          const c = palette[ch]
          if (!c) return null
          return <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={c} />
        }),
      )}
    </svg>
  )
}

// ── Shiba ─────────────────────────────────────────────────────────────────────
const SHIBA_PAL: Record<string, string> = {
  o: '#3d2b1f', f: '#e8b14a', b: '#b8852f', w: '#fbf6e4',
  k: '#3d2b1f', n: '#3d2b1f', r: '#e89cae',
}

const SHIBA: Record<MascotMood, string[]> = {
  idle: [
    '................',
    '...oo......oo...',
    '..ofbo....obfo..',
    '.offfbooobffffo.',
    '.offffffffffffo.',
    '.offwwffffwwffo.',
    '.offwwffffwwffo.',
    '.offffknnkffffo.',
    '..offfwnnwfffo..',
    '..offfwwwwfffo..',
    '...offffffffo...',
    '....oooooooo....',
    '................',
    '................',
    '................',
    '................',
  ],
  happy: [
    '................',
    '...oo......oo...',
    '..ofbo....obfo..',
    '.offfbooobffffo.',
    '.offffffffffffo.',
    '.offooffffooffo.',
    '.offffffffffffo.',
    '.offffknnkffffo.',
    '..offfwwwwfffo..',
    '..offfwwwwfffo..',
    '..oofffffffffo..',
    '..oo.oooooooo.oo',
    '..o...........o.',
    '................',
    '................',
    '................',
  ],
  sad: [
    '................',
    '...oo......oo...',
    '..ofbo....obfo..',
    '.offfbooobffffo.',
    '.offffffffffffo.',
    '.offwwffffwwffo.',
    '.offwwffffwwffo.',
    '.offffknnkffffo.',
    '..offfwnnwfffo..',
    '..offffooffffo..',
    '..offfoooofffo..',
    '...offffffffo...',
    '....oooooooo....',
    '................',
    '................',
    '................',
  ],
  cheer: [
    '...oo......oo...',
    '..ofbo....obfo..',
    '.offfbooobffffo.',
    '.offffffffffffo.',
    '.offwwffffwwffo.',
    '.offwwffffwwffo.',
    '.offffknnkffffo.',
    '..offfwnnwfffo..',
    'oo.offfwwwwfffo.',
    'oo..offffffffo..',
    'o....oooooooo...',
    '...........oo.oo',
    '...........oo.oo',
    '..............o.',
    '................',
    '................',
  ],
}

// ── Cat ───────────────────────────────────────────────────────────────────────
const CAT_PALETTES: Record<CatVariant, Record<string, string>> = {
  black: {
    o: '#1a1108', w: '#2a1d14', s: '#0d0805', p: '#c47388',
    r: '#e8b14a', g: '#fbf6e4', k: '#e8b14a',
  },
  tuxedo: {
    o: '#1a1108', w: '#2a1d14', s: '#fbf6e4', p: '#e89cae',
    r: '#c47388', g: '#e8b14a', k: '#cfdab1',
  },
  calico: {
    o: '#3d2b1f', w: '#fbf6e4', s: '#d97a3c', p: '#e89cae',
    r: '#c47388', g: '#e8b14a', k: '#3d2b1f',
  },
  orange: {
    o: '#5a2e16', w: '#e8a05a', s: '#b8632a', p: '#fbf6e4',
    r: '#5e7e3a', g: '#e8b14a', k: '#3d2b1f',
  },
}

const CAT: Record<MascotMood, string[]> = {
  idle: [
    '................',
    '..oo.......oo...',
    '.opoo......oopo.',
    'opppos....soppo.',
    'oppppoooooopppoo',
    'osswwwwwwwwwwsso',
    'owwswwkkwwkkwwso',
    'owwwwwkkwwkkwwwo',
    'owwsswwwppwwsswo',
    'owwwwwwwwwwwwwwo',
    'owrrrrrrrrrrrrwo',
    'owrrrrrgrrrrrrwo',
    'owwwwwwwwwwwwwwo',
    '.oooooooooooooo.',
    '................',
    '................',
  ],
  happy: [
    '................',
    '..oo.......oo...',
    '.opoo......oopo.',
    'opppos....soppo.',
    'oppppoooooopppoo',
    'osswwwwwwwwwwsso',
    'owwswwoowwoowwso',
    'owwwwwwwwwwwwwwo',
    'owwsswoopppowsswo',
    'owwwwwwwppwwwwwo',
    'owrrrrrrrrrrrrwo',
    'owrrrrrgrrrrrrwo',
    'owwwwwwwwwwwwwwo',
    '.oooooooooooooo.',
    '................',
    '................',
  ],
  sad: [
    '................',
    '..oo.......oo...',
    '.opoo......oopo.',
    'opppos....soppo.',
    'oppppoooooopppoo',
    'osswwwwwwwwwwsso',
    'owwswwkkwwkkwwso',
    'owwwwwkkwwkkwwwo',
    'owwsswwwppwwsswo',
    'owwwwwooooowwwwo',
    'owrrrrrrrrrrrrwo',
    'owrrrrrgrrrrrrwo',
    'owwwwwwwwwwwwwwo',
    '.oooooooooooooo.',
    '................',
    '................',
  ],
  cheer: [
    '..oo..oo...oo..o',
    '.opoo.oo...oo.po',
    'opppos.....soppo',
    'opppoooooooopppo',
    'osswwwwwwwwwwsso',
    'owwswwoowwoowwso',
    'owwwwwwwwwwwwwwo',
    'owwsswoopppowsswo',
    'owwwwwwwppwwwwwo',
    'oo.wwwwwwwwwww.o',
    'oo.rrrrrrrrrrr.o',
    'o..rrrrgrrrrrr..',
    '...wwwwwwwwwww..',
    '....ooooooooo...',
    '................',
    '................',
  ],
}

// ── Public component ─────────────────────────────────────────────────────────
interface MascotProps {
  kind?: MascotKind
  variant?: CatVariant
  mood?: MascotMood
  size?: number
  style?: React.CSSProperties
}

export default function Mascot({
  kind = 'cat',
  variant = 'calico',
  mood = 'idle',
  size = 4,
  style,
}: MascotProps) {
  const set = kind === 'cat' ? CAT : SHIBA
  const pal = kind === 'cat' ? (CAT_PALETTES[variant] ?? CAT_PALETTES.calico) : SHIBA_PAL
  const grid = set[mood] ?? set.idle
  return <PG grid={grid} palette={pal} size={size} style={style} />
}

// ── Heart SVG ────────────────────────────────────────────────────────────────
export function PixelHeart({ size = 2 }: { size?: number }) {
  const px = size * 4
  return (
    <svg width={px * 3} height={px * 3} viewBox="0 0 9 9" shapeRendering="crispEdges"
      style={{ imageRendering: 'pixelated', display: 'inline-block' }}>
      <rect x="1" y="0" width="3" height="1" fill="#c47388" />
      <rect x="5" y="0" width="3" height="1" fill="#c47388" />
      <rect x="0" y="1" width="4" height="2" fill="#e89cae" />
      <rect x="5" y="1" width="4" height="2" fill="#e89cae" />
      <rect x="0" y="3" width="9" height="3" fill="#e89cae" />
      <rect x="1" y="6" width="7" height="1" fill="#e89cae" />
      <rect x="2" y="7" width="5" height="1" fill="#e89cae" />
      <rect x="3" y="8" width="3" height="1" fill="#e89cae" />
    </svg>
  )
}

// ── Star SVG ─────────────────────────────────────────────────────────────────
export function PixelStar({ size = 2 }: { size?: number }) {
  const s = size * 4
  return (
    <svg width={s} height={s} viewBox="0 0 10 10" shapeRendering="crispEdges"
      style={{ imageRendering: 'pixelated', display: 'inline-block' }}>
      <rect x="4" y="0" width="2" height="3" fill="#e8b14a" />
      <rect x="0" y="3" width="10" height="2" fill="#e8b14a" />
      <rect x="1" y="5" width="3" height="3" fill="#e8b14a" />
      <rect x="6" y="5" width="3" height="3" fill="#e8b14a" />
      <rect x="3" y="6" width="1" height="1" fill="#b8852f" />
      <rect x="6" y="6" width="1" height="1" fill="#b8852f" />
    </svg>
  )
}

// ── Coin SVG ─────────────────────────────────────────────────────────────────
export function PixelCoin({ size = 2 }: { size?: number }) {
  const s = size * 5
  return (
    <svg width={s} height={s} viewBox="0 0 10 10" shapeRendering="crispEdges"
      style={{ imageRendering: 'pixelated', display: 'inline-block' }}>
      <rect x="3" y="0" width="4" height="1" fill="#e8b14a" />
      <rect x="1" y="1" width="8" height="2" fill="#e8b14a" />
      <rect x="0" y="3" width="10" height="4" fill="#e8b14a" />
      <rect x="4" y="4" width="2" height="2" fill="#b8852f" />
      <rect x="1" y="7" width="8" height="2" fill="#e8b14a" />
      <rect x="3" y="9" width="4" height="1" fill="#e8b14a" />
    </svg>
  )
}
