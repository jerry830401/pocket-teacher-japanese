import { NavLink, Outlet } from 'react-router-dom'

const navItems = [
  { to: '/', label: '首頁' },
] as const

export default function Layout() {
  return (
    <div className="min-h-full flex flex-col">
      <header className="border-b border-slate-200 dark:border-slate-800">
        <nav className="mx-auto max-w-5xl px-4 py-3 flex items-center gap-6">
          <span className="font-semibold tracking-tight">
            Pocket Teacher Japanese
          </span>
          <ul className="flex gap-4 text-sm">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    isActive
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
