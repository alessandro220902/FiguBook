import { NavLink } from 'react-router-dom'

const TABS = [
  { to: '/community', label: 'Amici', end: true },
  { to: '/community/gruppi', label: 'Gruppi', end: false },
  { to: '/community/albo-doro', label: "Albo d'Oro", end: false },
]

export function CommunityTabs() {
  return (
    <div className="mt-6 flex gap-2 overflow-x-auto">
      {TABS.map((t) => (
        <NavLink
          key={t.to}
          to={t.to}
          end={t.end}
          className={({ isActive }) =>
            `whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              isActive ? 'bg-lime text-lime-ink' : 'border border-white/[0.1] text-ink-2 hover:border-white/25 hover:text-ink'
            }`
          }
        >
          {t.label}
        </NavLink>
      ))}
    </div>
  )
}
