'use client'
import { useRef } from 'react'
import Link from 'next/link'
import type { TMDBMovie, FilmCardStatus } from '@/lib/types'
import FilmPoster from './FilmPoster'

interface Props {
  title: string
  movies: TMDBMovie[]
  statuses: Record<number, FilmCardStatus>
  onOpenDetail: (id: number) => void
  seeAllHref?: string
  onStatusChange?: (tmdbId: number, newStatus: FilmCardStatus) => void
}

export default function FilmRow({ title, movies, statuses, onOpenDetail, seeAllHref, onStatusChange }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)

  function scroll(dir: 'left' | 'right') {
    if (!scrollRef.current) return
    scrollRef.current.scrollBy({ left: dir === 'right' ? 400 : -400, behavior: 'smooth' })
  }

  if (!movies.length) return null

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
          {seeAllHref && (
            <Link href={seeAllHref} className="text-xs text-text-muted hover:text-cinema-red transition-colors">
              See all →
            </Link>
          )}
        </div>
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
      <div className="relative">
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto py-3"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {movies.map(movie => (
            <FilmPoster
              key={movie.id}
              movie={movie}
              status={statuses[movie.id] ?? { status: null, score: null }}
              onClick={() => onOpenDetail(movie.id)}
              onRemoveStatus={onStatusChange
                ? () => onStatusChange(movie.id, { status: null, score: null })
                : undefined}
            />
          ))}
        </div>
        <div className="absolute right-0 top-0 h-full w-16 bg-gradient-to-l from-bg-base to-transparent pointer-events-none" />
      </div>
    </div>
  )
}
