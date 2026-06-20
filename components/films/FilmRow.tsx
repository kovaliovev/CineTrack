'use client'
import { useRef } from 'react'
import type { TMDBMovie, FilmCardStatus } from '@/lib/types'
import FilmPoster from './FilmPoster'

interface Props {
  title: string
  movies: TMDBMovie[]
  statuses: Record<number, FilmCardStatus>
  onOpenDetail: (id: number) => void
}

export default function FilmRow({ title, movies, statuses, onOpenDetail }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)

  function scroll(dir: 'left' | 'right') {
    if (!scrollRef.current) return
    scrollRef.current.scrollBy({ left: dir === 'right' ? 400 : -400, behavior: 'smooth' })
  }

  if (!movies.length) return null

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
        <div className="flex gap-1">
          <button
            onClick={() => scroll('left')}
            className="w-7 h-7 rounded-full bg-bg-elevated border border-bg-border flex items-center justify-center text-text-muted hover:text-white hover:border-cinema-red transition-colors"
            aria-label="Scroll left"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M7.5 2L3.5 6L7.5 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button
            onClick={() => scroll('right')}
            className="w-7 h-7 rounded-full bg-bg-elevated border border-bg-border flex items-center justify-center text-text-muted hover:text-white hover:border-cinema-red transition-colors"
            aria-label="Scroll right"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M4.5 2L8.5 6L4.5 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide pb-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {movies.map(movie => (
          <FilmPoster
            key={movie.id}
            movie={movie}
            status={statuses[movie.id] ?? { status: null, score: null }}
            onClick={() => onOpenDetail(movie.id)}
          />
        ))}
      </div>
    </div>
  )
}
