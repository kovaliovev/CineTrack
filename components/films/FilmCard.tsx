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

export default function FilmCard({ movie, initialStatus, onOpenDetail }: Props) {
  const [showPicker, setShowPicker] = useState(false)
  const year = movie.release_date ? Number(movie.release_date.slice(0, 4)) : null
  const poster = posterUrl(movie.poster_path)

  const { status, loading, addToWishlist, markWatched } = useFilmStatus(
    movie.id,
    initialStatus,
    { title: movie.title, poster_url: poster, year, genres: [] }
  )

  async function handleWatched(score: number) {
    await markWatched(score)
    setShowPicker(false)
  }

  const Spinner = () => (
    <span className="inline-block w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
  )

  return (
    <div className="relative group bg-bg-card rounded-xl overflow-hidden border border-transparent hover:border-cinema-red transition-all">
      {/* Poster */}
      <button
        className="w-full aspect-[2/3] bg-bg-elevated block relative overflow-hidden"
        onClick={() => onOpenDetail?.(movie.id)}
      >
        {poster ? (
          <Image src={poster} alt={movie.title} fill className="object-cover" sizes="200px" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-text-muted text-xs">No poster</div>
        )}
        {/* Status badge */}
        {status.status === 'wishlist' && (
          <div className="absolute top-2 right-2 bg-cinema-red text-white text-xs px-1.5 py-0.5 rounded font-semibold">
            ♥
          </div>
        )}
        {status.status === 'watched' && status.score !== null && (
          <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded font-semibold">
            {status.score}
          </div>
        )}
      </button>

      {/* Info */}
      <div className="p-2.5">
        <p className="text-sm font-medium text-text-primary truncate leading-tight">{movie.title}</p>
        {year && <p className="text-xs text-text-muted mt-0.5">{year}</p>}

        {/* Action buttons */}
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
            <button
              onClick={addToWishlist}
              disabled={loading}
              className={`flex-1 text-xs py-1.5 rounded transition-colors active:scale-95 ${
                status.status === 'wishlist'
                  ? 'bg-cinema-red-dim border border-cinema-red-border text-cinema-red'
                  : 'bg-bg-elevated text-text-muted hover:bg-cinema-red hover:text-white'
              }`}
            >
              {loading ? <Spinner /> : status.status === 'wishlist' ? '♥ Wish' : '+ Wish'}
            </button>
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
