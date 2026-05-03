import type { CatVariant, DogVariant, MascotKind } from '@/stores/useSettings'

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

// ── Dog ───────────────────────────────────────────────────────────────────────
// palette keys:
//   o=outline  f=main fur  d=dark fur shadow  w=white muzzle area
//   c=cream chest/cheek  k=pupil  n=nose  r=mouth
//   e=blue eye iris (husky only)
const DOG_PALETTES: Record<DogVariant, Record<string, string>> = {
  shiba: {
    o: '#2e1a0e', f: '#d4762a', d: '#b05a18', w: '#f5ede0',
    c: '#f0d8b8', k: '#2e1a0e', n: '#2e1a0e', r: '#c06060',
  },
  corgi: {
    o: '#2e1a0e', f: '#d98c3a', d: '#b86c20', w: '#f8f0e0',
    c: '#f8f0e0', k: '#2e1a0e', n: '#2e1a0e', r: '#c06060',
  },
  poodle: {
    o: '#1a1020', f: '#c0a8e8', d: '#9070c8', w: '#f5f0fa',
    c: '#f5f0fa', k: '#1a1020', n: '#1a1020', r: '#c06080',
  },
  husky: {
    o: '#181820', f: '#d0d8e8', d: '#383848', w: '#f8f8fc',
    c: '#f8f8fc', k: '#181820', n: '#181820', r: '#c06060',
    e: '#4080d0',
  },
}

// ── Shiba Inu ─────────────────────────────────────────────────────────────────
// Sharp pointy ears, orange body, white cream muzzle patch
const SHIBA_GRIDS: Record<MascotMood, string[]> = {
  idle: [
    '..oo........oo..',
    '..ofo......ofo..',
    '..offo....offo..',
    '.offffooooffffo.',
    '.offffffffffffo.',
    '.ofwwfffffffwfo.',
    '.ofwwfffkfffwfo.',
    '.ofccfkfffkccfo.',
    '.offcfwnnwfcffo.',
    '..offcwwwwcffo..',
    '..offfffrrffffo.',
    '...oooooooooo...',
    '................',
    '................',
    '................',
    '................',
  ],
  happy: [
    '..oo........oo..',
    '..ofo......ofo..',
    '..offo....offo..',
    '.offffooooffffo.',
    '.offffffffffffo.',
    '.ofwwfffffffwfo.',
    '.ofwwffoffofwfo.',
    '.ofccfffffffcfo.',
    '.offcfwnnwfcffo.',
    '..offcwwwwcffo..',
    '..offffrrrrfffo.',
    '...oooooooooo...',
    '.oo..........oo.',
    '..o..........o..',
    '................',
    '................',
  ],
  sad: [
    '..oo........oo..',
    '..ofo......ofo..',
    '..offo....offo..',
    '.offffooooffffo.',
    '.offffffffffffo.',
    '.ofwwfffffffwfo.',
    '.ofwwfffkfffwfo.',
    '.ofccfkfffkccfo.',
    '.offcfwnnwfcffo.',
    '..offcfooocffo..',
    '..offfffffffffo.',
    '...oooooooooo...',
    '................',
    '................',
    '................',
    '................',
  ],
  cheer: [
    '..oo........oo..',
    '..ofo......ofo..',
    '..offo....offo..',
    '.offffooooffffo.',
    '.offffffffffffo.',
    '.ofwwffoffofwfo.',
    '.ofccfffffffcfo.',
    '.offcfwnnwfcffo.',
    'ooffcwwwwcfffooo',
    'oo.fffffrrfffoo.',
    'o....oooooooo...',
    '..............oo',
    '.............oo.',
    '................',
    '................',
    '................',
  ],
}

// ── Corgi ─────────────────────────────────────────────────────────────────────
// Very large bat-like ears, wide round head, orange+white
const CORGI_GRIDS: Record<MascotMood, string[]> = {
  idle: [
    '.ooo......ooo...',
    'ofdfoo..oofdfoo.',
    'ofdffoooofffdfoo',
    '.offfffffffffffo',
    '.occcfffffffcccf',
    '.occcfffkfffcccf',
    '.ofccfkfffkcccfo',
    '.offcfwnnwfcfffo',
    '..offcwwwwcfffo.',
    '..offffrrrffffo.',
    '...oooooooooo...',
    '................',
    '................',
    '................',
    '................',
    '................',
  ],
  happy: [
    '.ooo......ooo...',
    'ofdfoo..oofdfoo.',
    'ofdffoooofffdfoo',
    '.offffffffffffo.',
    '.occcfffffffcccf',
    '.occcffoffofcccf',
    '.ofccfffffffcccf',
    '.offcfwnnwfcfffo',
    '..offcwwwwcfffo.',
    '..offfffrrffffo.',
    '...oooooooooo...',
    '.oo..........oo.',
    '..o..........o..',
    '................',
    '................',
    '................',
  ],
  sad: [
    '.ooo......ooo...',
    'ofdfoo..oofdfoo.',
    'ofdffoooofffdfoo',
    '.offffffffffffo.',
    '.occcfffffffcccf',
    '.occcfffkfffcccf',
    '.ofccfkfffkcccfo',
    '.offcfwnnwfcfffo',
    '..offcfoooffffo.',
    '..offffrffffo...',
    '...oooooooooo...',
    '................',
    '................',
    '................',
    '................',
    '................',
  ],
  cheer: [
    '.ooo......ooo...',
    'ofdfoo..oofdfoo.',
    'ofdffoooofffdfoo',
    '.offffffffffffo.',
    '.occcffoffofcccf',
    '.ofccfffffffcccf',
    '.offcfwnnwfcfffo',
    'ooffcwwwwcfffoo.',
    'oo.fffffrrfffoo.',
    'o....oooooooo...',
    '..............oo',
    '.............oo.',
    '................',
    '................',
    '................',
    '................',
  ],
}

// ── Poodle ────────────────────────────────────────────────────────────────────
// Round pom-pom head bumps on ears, soft lavender
const POODLE_GRIDS: Record<MascotMood, string[]> = {
  idle: [
    '.ooo......ooo...',
    'offfo....offfo..',
    'offfoooofffffo..',
    'offffffffffffo..',
    '.ofwwfffffffwfo.',
    '.ofwwfffkfffwfo.',
    '.ofccfkfffkccfo.',
    '.offcfwnnwfcffo.',
    '..offcwwwwcffo..',
    '..offfffrrffffo.',
    '...oooooooooo...',
    '................',
    '................',
    '................',
    '................',
    '................',
  ],
  happy: [
    '.ooo......ooo...',
    'offfo....offfo..',
    'offfoooofffffo..',
    'offffffffffffo..',
    '.ofwwfffffffwfo.',
    '.ofwwffoffofwfo.',
    '.ofccfffffffcfo.',
    '.offcfwnnwfcffo.',
    '..offcwwwwcffo..',
    '..offffrrrrfffo.',
    '...oooooooooo...',
    '.oo..........oo.',
    '..o..........o..',
    '................',
    '................',
    '................',
  ],
  sad: [
    '.ooo......ooo...',
    'offfo....offfo..',
    'offfoooofffffo..',
    'offffffffffffo..',
    '.ofwwfffffffwfo.',
    '.ofwwfffkfffwfo.',
    '.ofccfkfffkccfo.',
    '.offcfwnnwfcffo.',
    '..offcfooocffo..',
    '..offfffffffffo.',
    '...oooooooooo...',
    '................',
    '................',
    '................',
    '................',
    '................',
  ],
  cheer: [
    '.ooo......ooo...',
    'offfo....offfo..',
    'offfoooofffffo..',
    'offffffffffffo..',
    '.ofwwffoffofwfo.',
    '.ofccfffffffcfo.',
    '.offcfwnnwfcffo.',
    'ooffcwwwwcfffoo.',
    'oo.fffffrrfffoo.',
    'o....oooooooo...',
    '..............oo',
    '.............oo.',
    '................',
    '................',
    '................',
    '................',
  ],
}

// ── Husky ─────────────────────────────────────────────────────────────────────
// Pointy ears, black mask on white face, vivid blue eyes
const HUSKY_GRIDS: Record<MascotMood, string[]> = {
  idle: [
    '..oo........oo..',
    '..odo......odo..',
    '..oddo....oddo..',
    '.oddddooooddddfo',
    '.offfffffffffff.',
    '.odddfffkfffdddo',
    '.odddfeeeefdddo.',
    '.offdfkfffkdffo.',
    '.offcfwnnwfcffo.',
    '..offcwwwwcffo..',
    '..offfffrrffffo.',
    '...oooooooooo...',
    '................',
    '................',
    '................',
    '................',
  ],
  happy: [
    '..oo........oo..',
    '..odo......odo..',
    '..oddo....oddo..',
    '.oddddooooddddfo',
    '.offfffffffffff.',
    '.odddffoffofdddo',
    '.odddfffffffdddo',
    '.offcfwnnwfcffo.',
    '..offcwwwwcffo..',
    '..offffrrrrfffo.',
    '...oooooooooo...',
    '.oo..........oo.',
    '..o..........o..',
    '................',
    '................',
    '................',
  ],
  sad: [
    '..oo........oo..',
    '..odo......odo..',
    '..oddo....oddo..',
    '.oddddooooddddfo',
    '.offfffffffffff.',
    '.odddfffkfffdddo',
    '.odddfeeeefdddo.',
    '.offdfkfffkdffo.',
    '.offcfwnnwfcffo.',
    '..offcfooocffo..',
    '..offfffffffffo.',
    '...oooooooooo...',
    '................',
    '................',
    '................',
    '................',
  ],
  cheer: [
    '..oo........oo..',
    '..odo......odo..',
    '..oddo....oddo..',
    '.oddddooooddddfo',
    '.offfffffffffff.',
    '.odddffoffofdddo',
    '.odddfffffffdddo',
    '.offcfwnnwfcffo.',
    'ooffcwwwwcfffoo.',
    'oo.fffffrrfffoo.',
    'o....oooooooo...',
    '..............oo',
    '.............oo.',
    '................',
    '................',
    '................',
  ],
}

const DOG_GRIDS: Record<DogVariant, Record<MascotMood, string[]>> = {
  shiba:  SHIBA_GRIDS,
  corgi:  CORGI_GRIDS,
  poodle: POODLE_GRIDS,
  husky:  HUSKY_GRIDS,
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
    'owwsswoopppowssw',
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
    'owwsswoopppowssw',
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
  variant?: CatVariant | DogVariant
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
  let grid: string[]
  let pal: Record<string, string>
  if (kind === 'cat') {
    const cv = variant as CatVariant
    pal = CAT_PALETTES[cv] ?? CAT_PALETTES.calico
    grid = CAT[mood] ?? CAT.idle
  } else {
    const dv = (variant as DogVariant) in DOG_GRIDS ? (variant as DogVariant) : 'shiba'
    pal = DOG_PALETTES[dv]
    grid = DOG_GRIDS[dv][mood] ?? DOG_GRIDS[dv].idle
  }
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
