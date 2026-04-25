import { NavLink, Outlet } from 'react-router-dom'

// 每個導覽項目的圖示用日文字符，直覺又省外部依賴
const navItems = [
  {
    to: '/',
    end: true,
    label: '首頁',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9.75L12 3l9 6.75V21a.75.75 0 0 1-.75.75H15v-6h-6v6H3.75A.75.75 0 0 1 3 21V9.75z" />
      </svg>
    ),
  },
  {
    to: '/kana',
    end: false,
    label: '五十音',
    icon: <span className="text-lg leading-none font-medium">あ</span>,
  },
  {
    to: '/vocabulary',
    end: false,
    label: '單字',
    icon: <span className="text-lg leading-none font-medium">語</span>,
  },
  {
    to: '/grammar',
    end: false,
    label: '文法',
    icon: <span className="text-lg leading-none font-medium">文</span>,
  },
] as const

export default function Layout() {
  return (
    <div className="min-h-full flex flex-col">

      {/* ── 桌機頂部導覽（md 以上顯示）── */}
      <header className="hidden md:block border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center gap-6">
          <span className="font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Pocket Teacher Japanese
          </span>
          <ul className="flex gap-1">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
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
        </div>
      </header>

      {/* ── 主要內容區 ── */}
      {/* pb-20 留空間給手機底部導覽；md 以上不需要 */}
      <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-6 pb-24 md:pb-8">
        <Outlet />
      </main>

      {/* ── 手機底部導覽（md 以下顯示）── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white/90 dark:bg-slate-950/90 backdrop-blur border-t border-slate-200 dark:border-slate-800">
        <ul className="flex">
          {navItems.map((item) => (
            <li key={item.to} className="flex-1">
              <NavLink
                to={item.to}
                end={item.end}
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
        {/* iOS safe area */}
        <div className="h-safe-bottom" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }} />
      </nav>

    </div>
  )
}
