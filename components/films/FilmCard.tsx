'use client'
import { useState } from 'react'
import Image from 'next/image'
import { useFilmStatus } from '@/hooks/useFilmStatus'
import RatingPicker from './RatingPicker'
import type { TMDBMovie, FilmCardStatus } from '@/lib/types'
import { posterUrl } from '@/lib/tmdb'

interface Props {
  movie: TMDBMovie
  initialStatus: FilmCardStatus
  onOpenDetail?: (tmdbId: number) => void
}

const Spinner = () => (
  <span className="inline-block w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
)

export default function FilmCard({ movie, initialStatus, onOpenDetail }: Props) {
  const [showPicker, setShowPicker] = useState(false)
  const year   = movie.release_date ? Number(movie.release_date.slice(0, 4)) : null
  const poster = posterUrl(movie.poster_path)

  const { status, loading, addToWishlist, markWatched, removeFromList } = useFilmStatus(
    movie.id,
    initialStatus,
    { title: movie.title, poster_url: poster, year, genres: [] }
  )

  async function handleWatched(score: number) {
    await markWatched(score)
    setShowPicker(false)
  }

  return (
    <div className="relative group bg-bg-card rounded-xl overflow-visible border border-transparent hover:border-cinema-red transition-all">
      {/* Poster area */}
      <div className="relative w-full aspect-[2/3] rounded-t-xl overflow-hidden">

        {/* Grayscale layer: poster + TMDB score go under this filter when watched */}
        <div className={`absolute inset-0 transition-all${status.status === 'watched' ? ' grayscale brightness-75' : ''}`}>
          <button
            className="absolute inset-0 bg-bg-elevated"
            onClick={() => onOpenDetail?.(movie.id)}
          >
            {poster ? (
              <Image src={poster} alt={movie.title} fill className="object-cover" sizes="200px" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-text-muted text-xs">No poster</div>
            )}
          </button>

          {/* TMDB audience score — inside grayscale wrapper */}
          {movie.vote_average != null && movie.vote_average > 0 && (
            <div className="absolute top-2 left-2 z-10 bg-black/70 backdrop-blur-sm text-white text-[10px] font-semibold px-1.5 py-0.5 rounded pointer-events-none">
              ★ {movie.vote_average.toFixed(1)}
            </div>
          )}
        </div>

        {/* Centered user score — above grayscale, in full color */}
        {status.status === 'watched' && status.score !== null && (
          <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
            <div className="w-12 h-12 rounded-full bg-black/65 ring-2 ring-white/30 flex items-center justify-center text-white text-xl font-bold shadow-lg">
              {status.score}
            </div>
          </div>
        )}

        {/* Status badges — above grayscale wrapper, always in color */}
        {status.status === 'wishlist' && (
          <button
            onClick={removeFromList}
            title="Remove from wishlist"
            disabled={loading}
            className="absolute top-2 right-2 z-30 bg-cinema-red text-white text-xs w-6 h-6 rounded flex items-center justify-center font-bold hover:bg-red-700 transition-colors group/badge"
          >
            <span className="group-hover/badge:hidden leading-none">♥</span>
            <span className="hidden group-hover/badge:flex items-center justify-center leading-none">×</span>
          </button>
        )}
        {status.status === 'watched' && (
          <button
            onClick={removeFromList}
            title="Remove from watched"
            disabled={loading}
            className="absolute top-2 right-2 z-30 bg-black/60 text-white/60 text-xs w-6 h-6 rounded flex items-center justify-center hover:bg-red-900/80 hover:text-white transition-colors"
          >
            ×
          </button>
        )}
      </div>

      {/* Info */}
      <div className="p-2.5">
        <p className="text-sm font-medium text-text-primary truncate leading-tight">{movie.title}</p>
        {year && <p className="text-xs text-text-muted mt-0.5">{year}</p>}

        {showPicker ? (
          <div className="mt-2">
            <RatingPicker
              value={status.score}
              onChange={handleWatched}
              onCancel={() => setShowPicker(false)}
            />
          </div>
        ) : (
          <div className="flex gap-1.5 mt-2">
            {/* Wish button: hidden when watched, toggles remove when wishlisted */}
            {status.status !== 'watched' && (
              <button
                onClick={status.status === 'wishlist' ? removeFromList : addToWishlist}
                disabled={loading}
                className={`flex-1 text-xs py-1.5 rounded transition-colors active:scale-95 ${
                  status.status === 'wishlist'
                    ? 'bg-cinema-red/15 border border-cinema-red-border text-cinema-red hover:bg-red-900/20'
                    : 'bg-bg-elevated text-text-muted hover:bg-cinema-red hover:text-white'
                }`}
              >
                {loading ? <Spinner /> : status.status === 'wishlist' ? '♥ Wish' : '+ Wish'}
              </button>
            )}

            {/* Seen button */}
            <button
              onClick={() => setShowPicker(true)}
              disabled={loading}
              className={`flex-1 text-xs py-1.5 rounded transition-colors active:scale-95 ${
                status.status === 'watched'
                  ? 'bg-white/10 border border-white/20 text-text-secondary'
                  : 'bg-bg-elevated text-text-muted hover:bg-bg-elevated hover:text-white'
              }`}
            >
              {loading ? <Spinner /> : status.status === 'watched' ? `✓ ${status.score}` : '✓ Seen'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
