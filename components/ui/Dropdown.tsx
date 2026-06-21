'use client'
import { useState, useRef, useEffect, useContext, createContext } from 'react'

const DropdownCloseContext = createContext<() => void>(() => {})

export function Dropdown({
  label,
  active,
  children,
}: {
  label: string
  active: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  return (
    <DropdownCloseContext.Provider value={() => setOpen(false)}>
      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen(o => !o)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors border ${
            active
              ? 'bg-cinema-red/10 border-cinema-red-border text-cinema-red'
              : 'bg-bg-elevated border-bg-border text-text-secondary hover:text-white hover:border-cinema-red'
          }`}
        >
          {label}
          <svg
            width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true"
            className={`transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
          >
            <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {open && (
          <div className="absolute top-full left-0 mt-1.5 bg-bg-card border border-bg-border rounded-xl shadow-xl z-50 py-1 min-w-[160px]">
            {children}
          </div>
        )}
      </div>
    </DropdownCloseContext.Provider>
  )
}

export function DropdownItem({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  const close = useContext(DropdownCloseContext)
  return (
    <button
      onClick={() => { onClick(); close() }}
      className={`w-full text-left px-4 py-2 text-sm transition-colors ${
        active ? 'text-cinema-red font-medium' : 'text-text-secondary hover:text-white hover:bg-bg-elevated'
      }`}
    >
      {label}
    </button>
  )
}
