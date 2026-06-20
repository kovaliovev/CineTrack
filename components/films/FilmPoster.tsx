'use client'
import Image from 'next/image'
import type { TMDBMovie, FilmCardStatus } from '@/lib/types'
import { posterUrl } from '@/lib/tmdb'

interface Props {
  movie: TMDBMovie
  status: FilmCardStatus
  onClick: () => void
  onRemoveStatus?: () => void
}

export default function FilmPoster({ movie, status, onClick, onRemoveStatus }: Props) {
  const poster = posterUrl(movie.poster_path)

  return (
    <div className="relative flex-shrink-0 w-32 aspect-[2/3] hover:scale-105 transition-all duration-200">
      {/* Main poster button */}
      <button
        onClick={onClick}
        className="absolute inset-0 rounded-lg overflow-hidden bg-bg-elevated border border-transparent hover:border-cinema-red transition-colors group"
      >
        {poster ? (
          <Image src={poster} alt={movie.title} fill className="object-cover" sizes="128px" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-text-muted text-xs p-2 text-center">
            {movie.title}
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
          <p className="text-white text-xs font-medium leading-tight line-clamp-2">{movie.title}</p>
        </div>
      </button>

      {/* Wishlist badge — sibling of poster button, no nested-button issue */}
      {status.status === 'wishlist' && (
        onRemoveStatus ? (
          <button
            onClick={e => { e.stopPropagation(); onRemoveStatus() }}
            title="Remove from wishlist"
            className="absolute top-1.5 right-1.5 z-10 bg-cinema-red text-white text-xs w-5 h-5 rounded flex items-center justify-center font-bold hover:bg-red-700 transition-colors group/badge"
          >
            <span className="group-hover/badge:hidden leading-none">♥</span>
            <span className="hidden group-hover/badge:flex items-center justify-center leading-none">×</span>
          </button>
        ) : (
          <div className="absolute top-1.5 right-1.5 z-10 bg-cinema-red text-white text-xs w-5 h-5 rounded flex items-center justify-center font-bold pointer-events-none">
            ♥
          </div>
        )
      )}

      {/* Watched badge */}
      {status.status === 'watched' && status.score !== null && (
        onRemoveStatus ? (
          <button
            onClick={e => { e.stopPropagation(); onRemoveStatus() }}
            title="Remove from watched"
            className="absolute top-1.5 right-1.5 z-10 bg-black/70 text-white text-xs px-1 py-0.5 rounded font-semibold hover:bg-red-900/80 transition-colors group/badge"
          >
            <span className="group-hover/badge:hidden">{status.score}</span>
            <span className="hidden group-hover/badge:block">×</span>
          </button>
        ) : (
          <div className="absolute top-1.5 right-1.5 z-10 bg-black/70 text-white text-xs px-1 py-0.5 rounded font-semibold pointer-events-none">
            {status.score}
          </div>
        )
      )}
    </div>
  )
}
