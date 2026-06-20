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

  return (
    <div className="flex-1 relative max-w-sm">
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
        <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M9.5 9.5L13 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
      <input
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder="Search films…"
        className="w-full bg-bg-elevated border border-bg-border rounded-lg pl-9 pr-4 py-2 text-sm outline-none focus:border-cinema-red transition-colors"
      />
    </div>
  )
}
