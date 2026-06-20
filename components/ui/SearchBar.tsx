'use client'
import { useState, useEffect } from 'react'

interface Props {
  onSearch: (query: string) => void
  debounceMs?: number
}

export default function SearchBar({ onSearch, debounceMs = 400 }: Props) {
  const [value, setValue] = useState('')

  useEffect(() => {
    const t = setTimeout(() => onSearch(value), debounceMs)
    return () => clearTimeout(t)
  }, [value, onSearch, debounceMs])

  function clear() {
    setValue('')
    onSearch('')
  }

  return (
    <div className="flex-1 relative max-w-sm">
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
        <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M9.5 9.5L13 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
      <input
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder="Search films…"
        className="w-full bg-bg-elevated border border-bg-border rounded-lg pl-9 pr-8 py-2 text-sm outline-none focus:border-cinema-red transition-colors"
      />
      {value && (
        <button
          onClick={clear}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-white transition-colors"
          aria-label="Clear search"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      )}
    </div>
  )
}
