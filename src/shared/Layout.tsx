import { NavLink, Outlet, useLocation } from 'react-router-dom'

const navItems = [
  {
    to: '/learn',
    label: '學習',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M11.25 4.533A9.707 9.707 0 0 0 6 3a9.735 9.735 0 0 0-3.25.555.75.75 0 0 0-.5.707v14.25a.75.75 0 0 0 1 .707A8.237 8.237 0 0 1 6 18.75c1.995 0 3.823.707 5.25 1.886V4.533ZM12.75 20.636A8.214 8.214 0 0 1 18 18.75c.966 0 1.89.166 2.75.47a.75.75 0 0 0 1-.708V4.262a.75.75 0 0 0-.5-.707A9.735 9.735 0 0 0 18 3a9.707 9.707 0 0 0-5.25 1.533v16.103Z" />
      </svg>
    ),
  },
  {
    to: '/quiz',
    label: '測驗',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm11.378-3.917c-.89-.777-2.366-.777-3.255 0a.75.75 0 0 1-.988-1.129c1.454-1.272 3.776-1.272 5.23 0 1.454 1.272 1.454 3.329 0 4.601-.42.368-.903.6-1.407.706-.197.04-.306.11-.342.17a.75.75 0 0 1-1.3-.75c.316-.547.87-.914 1.525-1.048.292-.06.528-.179.696-.327.508-.445.508-1.276 0-1.722Zm-.878 5.167a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    to: '/review',
    label: '錯題',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path fillRule="evenodd" d="M4.755 10.059a7.5 7.5 0 0 1 12.548-3.364l1.903 1.903h-3.183a.75.75 0 1 0 0 1.5h4.992a.75.75 0 0 0 .75-.75V4.356a.75.75 0 0 0-1.5 0v3.18l-1.9-1.9A9 9 0 0 0 3.306 9.67a.75.75 0 1 0 1.45.388Zm15.408 3.352a.75.75 0 0 0-.919.53 7.5 7.5 0 0 1-12.548 3.364l-1.902-1.903h3.183a.75.75 0 0 0 0-1.5H2.984a.75.75 0 0 0-.75.75v4.992a.75.75 0 0 0 1.5 0v-3.18l1.9 1.9a9 9 0 0 0 15.059-4.035.75.75 0 0 0-.53-.918Z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    to: '/progress',
    label: '進度',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M18.375 2.25c-1.035 0-1.875.84-1.875 1.875v15.75c0 1.035.84 1.875 1.875 1.875h.75c1.035 0 1.875-.84 1.875-1.875V4.125c0-1.036-.84-1.875-1.875-1.875h-.75ZM9.75 8.625c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-.75a1.875 1.875 0 0 1-1.875-1.875V8.625ZM3 13.125c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v6.75c0 1.035-.84 1.875-1.875 1.875h-.75A1.875 1.875 0 0 1 3 19.875v-6.75Z" />
      </svg>
    ),
  },
] as const

const SettingsIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path fillRule="evenodd" d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567L9.05 4.889c-.02.12-.115.26-.297.348a7.493 7.493 0 0 0-.986.57c-.166.115-.334.126-.45.083L6.3 5.508a1.875 1.875 0 0 0-2.282.819l-.922 1.597a1.875 1.875 0 0 0 .432 2.385l.84.692c.095.078.17.229.154.43a7.598 7.598 0 0 0 0 1.139c.015.2-.059.352-.153.43l-.841.692a1.875 1.875 0 0 0-.432 2.385l.922 1.597a1.875 1.875 0 0 0 2.282.818l1.019-.382c.115-.043.283-.031.45.082.312.214.641.405.985.57.182.088.277.228.297.35l.178 1.071c.151.904.933 1.567 1.85 1.567h1.844c.916 0 1.699-.663 1.85-1.567l.178-1.072c.02-.12.114-.26.297-.349.344-.165.673-.356.985-.57.167-.114.335-.125.45-.082l1.02.382a1.875 1.875 0 0 0 2.28-.819l.923-1.597a1.875 1.875 0 0 0-.432-2.385l-.84-.692c-.095-.078-.17-.229-.154-.43a7.614 7.614 0 0 0 0-1.139c-.016-.2.059-.352.153-.43l.84-.692c.708-.582.891-1.59.433-2.385l-.922-1.597a1.875 1.875 0 0 0-2.282-.818l-1.02.382c-.114.043-.282.031-.449-.083a7.49 7.49 0 0 0-.985-.57c-.183-.087-.277-.227-.297-.348l-.179-1.072a1.875 1.875 0 0 0-1.85-1.567h-1.843ZM12 15.75a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Z" clipRule="evenodd" />
  </svg>
)

export default function Layout() {
  const { pathname } = useLocation()
  const isSettings = pathname === '/settings'

  return (
    <div
      className="h-dvh flex flex-col overflow-hidden"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
      }}
    >

      {/* ── 桌機頂部導覽（md 以上顯示）── */}
      <header className="hidden md:block shrink-0 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center gap-6">
          <span className="font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Pocket Teacher Japanese
          </span>
          <ul className="flex gap-1 flex-1">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    [
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100',
                    ].join(' ')
                  }
                >
                  {item.icon}
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
          {/* 設定按鈕（桌機） */}
          {!isSettings && (
            <NavLink
              to="/settings"
              className="flex items-center justify-center w-8 h-8 rounded-md transition-colors text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="設定"
            >
              <SettingsIcon />
            </NavLink>
          )}
        </div>
      </header>

      {/* ── 手機右上角設定按鈕（fixed，md 以下顯示）── */}
      {!isSettings && (
        <NavLink
          to="/settings"
          className="md:hidden fixed right-4 z-40 flex items-center justify-center w-9 h-9 rounded-full transition-colors text-slate-500 dark:text-slate-400 bg-white/80 dark:bg-slate-950/80 backdrop-blur"
          style={{ top: 'calc(env(safe-area-inset-top) + 0.75rem)' }}
          aria-label="設定"
        >
          <SettingsIcon />
        </NavLink>
      )}

      {/* ── 主要內容區 ── */}
      <main className="flex-1 min-h-0 overflow-hidden mx-auto w-full max-w-5xl px-4 md:py-6">
        <Outlet />
      </main>

      {/* ── 手機底部導覽佔位（只在 PWA standalone 模式生效）── */}
      <div
        className="md:hidden shrink-0 [@media(display-mode:standalone)]:block hidden"
        style={{ height: 'calc(env(safe-area-inset-bottom) + 3.75rem)' }}
        aria-hidden="true"
      />

      {/* ── 手機底部導覽（md 以下顯示）── */}
      <nav
        className="md:hidden shrink-0 fixed bottom-0 inset-x-0 z-50 bg-white/90 dark:bg-slate-950/90 backdrop-blur border-t border-slate-200 dark:border-slate-800"
        style={{
          paddingBottom: 'env(safe-area-inset-bottom)',
          paddingLeft: 'env(safe-area-inset-left)',
          paddingRight: 'env(safe-area-inset-right)',
        }}
      >
        <ul className="flex">
          {navItems.map((item) => (
            <li key={item.to} className="flex-1">
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  [
                    'flex flex-col items-center gap-1 w-full py-2.5 text-[11px] font-medium transition-colors',
                    isActive
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : 'text-slate-500 dark:text-slate-400',
                  ].join(' ')
                }
              >
                {item.icon}
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

    </div>
  )
}
