'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

function GradCapIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 22 8.5 12 15 2 8.5" />
      <path d="M6 11.8V17c0 1 2.4 3 6 3s6-2 6-3v-5.2" />
    </svg>
  )
}

function GridIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="7" height="7" x="3" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="14" rx="1" />
      <rect width="7" height="7" x="3" y="14" rx="1" />
    </svg>
  )
}

function KanbanIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="4" height="18" rx="1" />
      <rect x="10" y="3" width="4" height="13" rx="1" />
      <rect x="17" y="3" width="4" height="8" rx="1" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

const links = [
  { href: '/feed', label: 'Feed', icon: GridIcon },
  { href: '/tracker', label: 'Tracker', icon: KanbanIcon },
  { href: '/profile', label: 'Profile', icon: UserIcon },
]

export default function Nav() {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/feed') return pathname === '/feed' || pathname.startsWith('/scholarship')
    return pathname === href
  }

  return (
    <aside className="w-60 shrink-0 bg-[#0c0c24] border-r border-[#1e1e42] sticky top-0 h-screen flex flex-col overflow-y-auto">
      {/* Logo */}
      <div className="px-5 py-5">
        <Link href="/feed" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-500/30">
            <GradCapIcon />
          </div>
          <div className="leading-none">
            <p className="text-[13px] font-bold text-white tracking-tight">Scholarship</p>
            <p className="text-[13px] font-bold text-indigo-400/70 tracking-tight mt-0.5">Intelligence</p>
          </div>
        </Link>
      </div>

      <div className="mx-5 h-px bg-[#1e1e42]" />

      {/* Navigation */}
      <nav className="flex-1 p-3 flex flex-col gap-0.5 mt-1">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
              isActive(href)
                ? 'bg-indigo-500/15 text-indigo-300'
                : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
            }`}
          >
            <span className={isActive(href) ? 'text-indigo-400' : 'text-slate-500'}>
              <Icon />
            </span>
            {label}
          </Link>
        ))}
      </nav>

      {/* User info */}
      <div className="p-3">
        <div className="mx-px h-px bg-[#1e1e42] mb-3" />
        <div className="px-3 py-2.5 rounded-lg bg-[#13133a]/60 border border-[#2a2a50]/60">
          <p className="text-xs font-semibold text-slate-200">Landon Hill</p>
          <p className="text-xs text-slate-500 mt-0.5">IU Luddy · CS/AI · 2028</p>
        </div>
      </div>
    </aside>
  )
}
