'use client'
import { useState, useRef, useEffect } from 'react'

interface Genre { id: number; name: string }

interface Props {
  genres: Genre[]
  selectedGenre: number | null
  onGenreChange: (id: number | null) => void
  selectedDecade: number | null
  onDecadeChange: (decade: number | null) => void
  sort: string
  onSortChange: (sort: string) => void
}

const SORT_OPTIONS = [
  { label: 'Popularity', value: 'popularity.desc' },
  { label: 'Rating',     value: 'vote_average.desc' },
  { label: 'Newest',     value: 'primary_release_date.desc' },
  { label: 'Oldest',     value: 'primary_release_date.asc' },
]

const DECADES = [
  { label: '70s', value: 1970 },
  { label: '80s', value: 1980 },
  { label: '90s', value: 1990 },
  { label: '00s', value: 2000 },
  { label: '10s', value: 2010 },
  { label: '20s', value: 2020 },
]

function Dropdown({
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
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true"
          className={`transition-transform duration-150 ${open ? 'rotate-180' : ''}`}>
          <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1.5 bg-bg-card border border-bg-border rounded-xl shadow-xl z-50 py-1 min-w-[160px]">
          {children}
        </div>
      )}
    </div>
  )
}

function DropdownItem({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-2 text-sm transition-colors ${
        active ? 'text-cinema-red font-medium' : 'text-text-secondary hover:text-white hover:bg-bg-elevated'
      }`}
    >
      {label}
    </button>
  )
}

export default function FilterBar({
  genres, selectedGenre, onGenreChange,
  selectedDecade, onDecadeChange,
  sort, onSortChange,
}: Props) {
  const currentSort = SORT_OPTIONS.find(o => o.value === sort)
  const currentGenre = genres.find(g => g.id === selectedGenre)
  const currentDecade = DECADES.find(d => d.value === selectedDecade)

  return (
    <div className="flex flex-col gap-2">
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Sort */}
        <Dropdown label={currentSort ? currentSort.label : 'Sort'} active={false}>
          {SORT_OPTIONS.map(opt => (
            <DropdownItem
              key={opt.value}
              label={opt.label}
              active={sort === opt.value}
              onClick={() => onSortChange(opt.value)}
            />
          ))}
        </Dropdown>

        {/* Genre */}
        <Dropdown label={currentGenre ? currentGenre.name : 'Genre'} active={selectedGenre !== null}>
          <DropdownItem label="All genres" active={selectedGenre === null} onClick={() => onGenreChange(null)} />
          <div className="border-t border-bg-border my-1" />
          <div className="max-h-64 overflow-y-auto">
            {genres.map(g => (
              <DropdownItem
                key={g.id}
                label={g.name}
                active={selectedGenre === g.id}
                onClick={() => onGenreChange(g.id)}
              />
            ))}
          </div>
        </Dropdown>

        {/* Decade */}
        <Dropdown label={currentDecade ? currentDecade.label : 'Decade'} active={selectedDecade !== null}>
          <DropdownItem label="All decades" active={selectedDecade === null} onClick={() => onDecadeChange(null)} />
          <div className="border-t border-bg-border my-1" />
          {DECADES.map(d => (
            <DropdownItem
              key={d.value}
              label={d.label}
              active={selectedDecade === d.value}
              onClick={() => onDecadeChange(d.value)}
            />
          ))}
        </Dropdown>
      </div>

      {/* Active filter chips — only shown when something is selected */}
      {(selectedGenre !== null || selectedDecade !== null) && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-text-muted">Filtered by:</span>
          {currentGenre && (
            <button
              onClick={() => onGenreChange(null)}
              className="flex items-center gap-1 px-2 py-0.5 bg-cinema-red/10 border border-cinema-red-border text-cinema-red text-xs rounded-full hover:bg-cinema-red/20 transition-colors"
            >
              {currentGenre.name}
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden="true">
                <path d="M1 1L7 7M7 1L1 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          )}
          {currentDecade && (
            <button
              onClick={() => onDecadeChange(null)}
              className="flex items-center gap-1 px-2 py-0.5 bg-cinema-red/10 border border-cinema-red-border text-cinema-red text-xs rounded-full hover:bg-cinema-red/20 transition-colors"
            >
              {currentDecade.label}
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden="true">
                <path d="M1 1L7 7M7 1L1 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
