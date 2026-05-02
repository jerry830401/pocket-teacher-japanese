import React from 'react'

// SVG pixel icons avoid Unicode characters missing from Press Start 2P

function PxChevron({ color = 'currentColor' }: { color?: string }) {
  // 4×6 grid: >
  return (
    <svg
      width="8" height="12"
      viewBox="0 0 4 6"
      shapeRendering="crispEdges"
      style={{ display: 'block', flexShrink: 0 }}
    >
      <rect x="0" y="0" width="1" height="1" fill={color} />
      <rect x="1" y="1" width="1" height="1" fill={color} />
      <rect x="2" y="2" width="1" height="2" fill={color} />
      <rect x="1" y="4" width="1" height="1" fill={color} />
      <rect x="0" y="5" width="1" height="1" fill={color} />
    </svg>
  )
}

function PxArrowLeft({ color = 'currentColor' }: { color?: string }) {
  // 6×5 grid: ←
  return (
    <svg
      width="12" height="10"
      viewBox="0 0 6 5"
      shapeRendering="crispEdges"
      style={{ display: 'block', flexShrink: 0 }}
    >
      <rect x="0" y="2" width="1" height="1" fill={color} />
      <rect x="1" y="1" width="1" height="3" fill={color} />
      <rect x="2" y="0" width="1" height="5" fill={color} />
      <rect x="3" y="2" width="3" height="1" fill={color} />
    </svg>
  )
}

interface BreadcrumbHeaderProps {
  title: string
  crumbs?: string[]
  canGoBack?: boolean
  onBack?: () => void
}

export default function BreadcrumbHeader({ title, crumbs = [], canGoBack, onBack }: BreadcrumbHeaderProps) {
  const pxFont: React.CSSProperties = {
    fontFamily: 'system-ui, sans-serif',
    fontSize: '1rem',
    lineHeight: 1.4,
  }
  const crumbFont: React.CSSProperties = {
    fontFamily: 'system-ui, sans-serif',
    fontWeight: 700,
    fontSize: '0.9375rem',
    lineHeight: 1.4,
  }

  return (
    <div style={{
      flexShrink: 0,
      padding: '14px 16px 10px',
      display: 'flex',
      alignItems: 'center',
      gap: 8,
    }}>
      {/* breadcrumb trail — overflow hidden only on last crumb span, not on the row itself */}
      <div style={{
        flex: 1,
        minWidth: 0,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}>
        <span style={{ ...pxFont, flexShrink: 0 }}>{title}</span>
        {crumbs.map((crumb, i) => (
          <React.Fragment key={i}>
            <PxChevron color="var(--color-ink-soft)" />
            <span style={{
              ...crumbFont,
              color: 'var(--color-ink-soft)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              ...(i === crumbs.length - 1 ? { flex: 1 } : { flexShrink: 0 }),
            }}>
              {crumb}
            </span>
          </React.Fragment>
        ))}
      </div>

      {/* back button: SVG arrow + Zen Maru 返回，both vertically centered by parent alignItems center */}
      {canGoBack && (
        <button
          className="pbtn pbtn-ghost"
          style={{ padding: '6px 10px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6 }}
          onClick={onBack}
        >
          <PxArrowLeft color="var(--color-ink)" />
          <span style={{ fontFamily: 'system-ui, sans-serif', fontWeight: 700, fontSize: '0.875rem' }}>返回</span>
        </button>
      )}
    </div>
  )
}
