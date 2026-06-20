'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Logo from '@/components/ui/Logo'

const NAV = [
  {
    href: '/discover',
    label: 'Discover',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <rect x="1" y="1" width="7" height="7" rx="1.5" fill="currentColor"/>
        <rect x="10" y="1" width="7" height="7" rx="1.5" fill="currentColor"/>
        <rect x="1" y="10" width="7" height="7" rx="1.5" fill="currentColor"/>
        <rect x="10" y="10" width="7" height="7" rx="1.5" fill="currentColor"/>
      </svg>
    ),
  },
  {
    href: '/my-list',
    label: 'My List',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <rect x="1" y="3" width="16" height="2" rx="1" fill="currentColor"/>
        <rect x="1" y="8" width="16" height="2" rx="1" fill="currentColor"/>
        <rect x="1" y="13" width="16" height="2" rx="1" fill="currentColor"/>
      </svg>
    ),
  },
  {
    href: '/partner-list',
    label: 'Partner',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <circle cx="9" cy="7" r="4" fill="currentColor"/>
        <path d="M1 17c0-4 3.6-6 8-6s8 2 8 6" fill="currentColor"/>
      </svg>
    ),
  },
  {
    href: '/couple',
    label: 'Couple',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <circle cx="6" cy="9" r="5" fill="currentColor" opacity="0.9"/>
        <circle cx="12" cy="9" r="5" fill="currentColor" opacity="0.5"/>
      </svg>
    ),
  },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-14 flex-shrink-0 bg-bg-sidebar border-r border-bg-border flex flex-col items-center py-4 gap-1">
      {/* Logo */}
      <Link href="/discover" className="mb-3" title="ReelTwo">
        <Logo size="sm" />
      </Link>

      <nav className="flex flex-col items-center gap-1">
        {NAV.map(item => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                active
                  ? 'bg-cinema-red text-white'
                  : 'text-text-muted hover:text-text-secondary hover:bg-bg-elevated'
              }`}
            >
              {item.icon}
            </Link>
          )
        })}
      </nav>

      {/* Profile at bottom */}
      <Link
        href="/profile"
        title="Profile"
        className={`mt-auto w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
          pathname === '/profile'
            ? 'bg-cinema-red text-white'
            : 'text-text-muted hover:text-text-secondary hover:bg-bg-elevated'
        }`}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
          <circle cx="9" cy="6" r="3.5" fill="currentColor"/>
          <path d="M2 16c0-3.3 3.1-5.5 7-5.5s7 2.2 7 5.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
        </svg>
      </Link>
    </aside>
  )
}
