import { NavLink, Outlet } from 'react-router-dom'

const NAV_ITEMS = [
  { to: '/learn',    label: '學習' },
  { to: '/quiz',     label: '測驗' },
  { to: '/review',   label: '錯題' },
  { to: '/progress', label: '進度' },
  { to: '/settings', label: '設定' },
] as const

// Pixel icon: simple 20×20 SVG shapes for each tab
function TabIcon({ id, active }: { id: string; active: boolean }) {
  const c = active ? 'var(--color-gold)' : 'var(--color-cream)'
  if (id === 'learn') return (
    <svg width="18" height="18" viewBox="0 0 10 10" shapeRendering="crispEdges" style={{ imageRendering: 'pixelated' }}>
      <rect x="1" y="1" width="3" height="5" fill={c} />
      <rect x="6" y="1" width="3" height="5" fill={c} />
      <rect x="4" y="2" width="2" height="7" fill={c} />
      <rect x="1" y="7" width="3" height="1" fill={c} />
      <rect x="6" y="7" width="3" height="1" fill={c} />
    </svg>
  )
  if (id === 'quiz') return (
    <svg width="18" height="18" viewBox="0 0 10 10" shapeRendering="crispEdges" style={{ imageRendering: 'pixelated' }}>
      <rect x="1" y="1" width="8" height="6" fill={c} />
      <rect x="2" y="2" width="6" height="4" fill="var(--color-ink)" />
      <rect x="3" y="3" width="2" height="2" fill={c} />
      <rect x="6" y="3" width="1" height="2" fill={c} />
      <rect x="4" y="8" width="2" height="1" fill={c} />
    </svg>
  )
  if (id === 'review') return (
    <svg width="18" height="18" viewBox="0 0 10 10" shapeRendering="crispEdges" style={{ imageRendering: 'pixelated' }}>
      <rect x="2" y="1" width="6" height="1" fill={c} />
      <rect x="1" y="2" width="1" height="6" fill={c} />
      <rect x="8" y="2" width="1" height="6" fill={c} />
      <rect x="2" y="8" width="3" height="1" fill={c} />
      <rect x="6" y="8" width="2" height="1" fill={c} />
      <rect x="4" y="4" width="2" height="3" fill={c} />
      <rect x="4" y="2" width="2" height="1" fill={c} />
    </svg>
  )
  if (id === 'progress') return (
    <svg width="18" height="18" viewBox="0 0 10 10" shapeRendering="crispEdges" style={{ imageRendering: 'pixelated' }}>
      <rect x="1" y="7" width="2" height="2" fill={c} />
      <rect x="4" y="5" width="2" height="4" fill={c} />
      <rect x="7" y="3" width="2" height="6" fill={c} />
      <rect x="1" y="1" width="1" height="4" fill={c} />
      <rect x="2" y="3" width="2" height="1" fill={c} />
      <rect x="4" y="1" width="2" height="2" fill={c} />
    </svg>
  )
  // settings
  return (
    <svg width="18" height="18" viewBox="0 0 10 10" shapeRendering="crispEdges" style={{ imageRendering: 'pixelated' }}>
      <rect x="4" y="1" width="2" height="1" fill={c} />
      <rect x="1" y="4" width="1" height="2" fill={c} />
      <rect x="8" y="4" width="1" height="2" fill={c} />
      <rect x="4" y="8" width="2" height="1" fill={c} />
      <rect x="3" y="2" width="4" height="6" fill={c} />
      <rect x="4" y="4" width="2" height="2" fill="var(--color-ink)" />
    </svg>
  )
}

export default function Layout() {
  return (
    <div
      className="flex flex-col overflow-hidden"
      style={{
        minHeight: '100dvh',
        background: 'var(--color-bg)',
        paddingTop: 'env(safe-area-inset-top)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
      }}
    >
      {/* ── 桌機頂部導覽 ── */}
      <header
        className="hidden md:flex shrink-0 items-center gap-6 px-6 py-3"
        style={{ background: 'var(--color-ink)' }}
      >
        <span style={{
          fontFamily: '"Press Start 2P", monospace',
          fontSize: 10,
          color: 'var(--color-gold)',
          letterSpacing: 1,
          lineHeight: 1.4,
          whiteSpace: 'nowrap',
        }}>
          PTJP
        </span>
        <nav className="flex gap-1 flex-1">
          {NAV_ITEMS.map((item) => {
            const id = item.to.slice(1)
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => [
                  'flex items-center gap-2 px-3 py-2 text-sm font-bold transition-colors',
                  isActive
                    ? 'text-gold'
                    : 'text-cream hover:text-gold',
                ].join(' ')}
                style={{ fontFamily: '"Zen Maru Gothic", sans-serif' }}
              >
                {({ isActive }) => (
                  <>
                    <TabIcon id={id} active={isActive} />
                    {item.label}
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>
      </header>

      {/* ── 主要內容區 ── */}
      <main
        className="flex-1 min-h-0 overflow-hidden mx-auto w-full max-w-2xl"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 64px)' }}
      >
        <Outlet />
      </main>

      {/* ── 手機底部導覽 ── */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-50"
        style={{ background: 'var(--color-ink)' }}
      >
        <div
          className="grid mx-auto max-w-2xl"
          style={{
            gridTemplateColumns: 'repeat(5, 1fr)',
            paddingBottom: 'env(safe-area-inset-bottom)',
          }}
        >
          {NAV_ITEMS.map((item) => {
            const id = item.to.slice(1)
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  ['px-tab', isActive ? 'active' : ''].join(' ')
                }
              >
                {({ isActive }) => (
                  <>
                    <TabIcon id={id} active={isActive} />
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
