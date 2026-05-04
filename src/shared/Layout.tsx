import { NavLink, Outlet } from "react-router-dom";
import { useSwUpdate } from "@/lib/useSwUpdate";

const NAV_ITEMS = [
  { to: "/learn", label: "學習" },
  { to: "/quiz", label: "測驗" },
  { to: "/review", label: "錯題" },
  { to: "/progress", label: "進度" },
  { to: "/settings", label: "設定" },
] as const;

// Pixel icon: simple 20×20 SVG shapes for each tab
function TabIcon({ id, active }: { id: string; active: boolean }) {
  const c = active ? "var(--color-gold)" : "var(--color-cream)";
  if (id === "learn")
    return (
      <svg
        width="20"
        height="20"
        viewBox="0 0 10 10"
        shapeRendering="crispEdges"
        style={{ imageRendering: "pixelated" }}
      >
        <rect x="1" y="1" width="3" height="5" fill={c} />
        <rect x="6" y="1" width="3" height="5" fill={c} />
        <rect x="4" y="2" width="2" height="7" fill={c} />
        <rect x="1" y="7" width="3" height="1" fill={c} />
        <rect x="6" y="7" width="3" height="1" fill={c} />
      </svg>
    );
  if (id === "quiz")
    return (
      <svg
        width="20"
        height="20"
        viewBox="0 0 10 10"
        shapeRendering="crispEdges"
        style={{ imageRendering: "pixelated" }}
      >
        <rect x="1" y="1" width="8" height="6" fill={c} />
        <rect x="2" y="2" width="6" height="4" fill="var(--color-ink)" />
        <rect x="3" y="3" width="2" height="2" fill={c} />
        <rect x="6" y="3" width="1" height="2" fill={c} />
        <rect x="4" y="8" width="2" height="1" fill={c} />
      </svg>
    );
  if (id === "review")
    return (
      <svg
        width="20"
        height="20"
        viewBox="0 0 10 10"
        shapeRendering="crispEdges"
        style={{ imageRendering: "pixelated" }}
      >
        <rect x="2" y="1" width="6" height="1" fill={c} />
        <rect x="1" y="2" width="1" height="6" fill={c} />
        <rect x="8" y="2" width="1" height="6" fill={c} />
        <rect x="2" y="8" width="3" height="1" fill={c} />
        <rect x="6" y="8" width="2" height="1" fill={c} />
        <rect x="4" y="4" width="2" height="3" fill={c} />
        <rect x="4" y="2" width="2" height="1" fill={c} />
      </svg>
    );
  if (id === "progress")
    return (
      <svg
        width="20"
        height="20"
        viewBox="0 0 10 10"
        shapeRendering="crispEdges"
        style={{ imageRendering: "pixelated" }}
      >
        <rect x="1" y="7" width="2" height="2" fill={c} />
        <rect x="4" y="5" width="2" height="4" fill={c} />
        <rect x="7" y="3" width="2" height="6" fill={c} />
        <rect x="1" y="1" width="1" height="4" fill={c} />
        <rect x="2" y="3" width="2" height="1" fill={c} />
        <rect x="4" y="1" width="2" height="2" fill={c} />
      </svg>
    );
  // settings
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 10 10"
      shapeRendering="crispEdges"
      style={{ imageRendering: "pixelated" }}
    >
      <rect x="4" y="1" width="2" height="1" fill={c} />
      <rect x="1" y="4" width="1" height="2" fill={c} />
      <rect x="8" y="4" width="1" height="2" fill={c} />
      <rect x="4" y="8" width="2" height="1" fill={c} />
      <rect x="3" y="2" width="4" height="6" fill={c} />
      <rect x="4" y="4" width="2" height="2" fill="var(--color-ink)" />
    </svg>
  );
}

export default function Layout() {
  const { hasUpdate, applyUpdate } = useSwUpdate();

  return (
    <div
      className="flex flex-col overflow-hidden"
      style={{
        position: "fixed",
        inset: 0,
        background: "var(--color-bg)",
        paddingTop: "env(safe-area-inset-top)",
      }}
    >
      {/* ── PWA 更新提示 ── */}
      {hasUpdate && (
        <div
          className="shrink-0 flex items-center justify-between px-4 py-2 gap-3"
          style={{
            background: "var(--color-gold)",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <span
            style={{
              fontSize: "0.8125rem",
              color: "var(--color-ink)",
              fontWeight: 700,
            }}
          >
            有新版本可用
          </span>
          <button
            onClick={applyUpdate}
            style={{
              fontSize: "0.75rem",
              fontWeight: 700,
              color: "var(--color-ink)",
              background: "var(--color-cream)",
              border: "none",
              borderRadius: 4,
              padding: "3px 10px",
              cursor: "pointer",
            }}
          >
            立即更新
          </button>
        </div>
      )}

      {/* ── 桌機頂部導覽 ── */}
      <header
        className="hidden md:flex shrink-0 items-center gap-6 px-6 py-3"
        style={{ background: "var(--color-ink)" }}
      >
        <span
          style={{
            fontFamily: "system-ui, sans-serif",
            fontSize: "0.8125rem",
            color: "var(--color-gold)",
            letterSpacing: 1,
            lineHeight: 1.4,
            whiteSpace: "nowrap",
          }}
        >
          PTJP
        </span>
        <nav className="flex gap-1 flex-1">
          {NAV_ITEMS.map((item) => {
            const id = item.to.slice(1);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  [
                    "flex items-center gap-2 px-3 py-2 text-sm font-bold transition-colors",
                    isActive ? "text-gold" : "text-cream hover:text-gold",
                  ].join(" ")
                }
                style={{ fontFamily: "system-ui, sans-serif" }}
              >
                {({ isActive }) => (
                  <>
                    <TabIcon id={id} active={isActive} />
                    {item.label}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </header>

      {/* ── 主要內容區 ── */}
      <main
        className="flex-1 min-h-0 overflow-hidden mx-auto w-full max-w-2xl"
        style={{
          paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 56px)",
        }}
      >
        <Outlet />
      </main>

      {/* ── 手機底部導覽 ── */}
      {/* bottom 偏移負的 safe-area，讓背景蓋過 home indicator；padding 把 tab 推回可見區 */}
      <nav
        className="md:hidden fixed inset-x-0 z-50"
        style={{
          bottom: "calc(-1 * env(safe-area-inset-bottom, 0px))",
          background: "var(--color-ink)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        <div
          className="grid mx-auto max-w-2xl"
          style={{ gridTemplateColumns: "repeat(5, 1fr)" }}
        >
          {NAV_ITEMS.map((item) => {
            const id = item.to.slice(1);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  ["px-tab", isActive ? "active" : ""].join(" ")
                }
              >
                {({ isActive }) => (
                  <>
                    <TabIcon id={id} active={isActive} />
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
