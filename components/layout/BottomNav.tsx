'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  {
    href: '/discover',
    label: 'Discover',
    icon: (
      <svg width="20" height="20" viewBox="0 0 18 18" fill="none" aria-hidden="true">
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
      <svg width="20" height="20" viewBox="0 0 18 18" fill="none" aria-hidden="true">
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
      <svg width="20" height="20" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <circle cx="9" cy="7" r="4" fill="currentColor"/>
        <path d="M1 17c0-4 3.6-6 8-6s8 2 8 6" fill="currentColor"/>
      </svg>
    ),
  },
  {
    href: '/couple',
    label: 'Couple',
    icon: (
      <svg width="20" height="20" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <circle cx="6" cy="9" r="5" fill="currentColor" opacity="0.9"/>
        <circle cx="12" cy="9" r="5" fill="currentColor" opacity="0.5"/>
      </svg>
    ),
  },
  {
    href: '/profile',
    label: 'Profile',
    icon: (
      <svg width="20" height="20" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <circle cx="9" cy="6" r="3.5" fill="currentColor"/>
        <path d="M2 16c0-3.3 3.1-5.5 7-5.5s7 2.2 7 5.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      </svg>
    ),
  },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 bg-bg-sidebar border-t border-bg-border z-30 flex items-stretch"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {NAV.map(item => {
        const active = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors ${
              active ? 'text-cinema-red' : 'text-text-muted'
            }`}
          >
            {item.icon}
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
