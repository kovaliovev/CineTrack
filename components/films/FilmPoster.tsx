'use client'
import Image from 'next/image'
import type { TMDBMovie, FilmCardStatus } from '@/lib/types'
import { posterUrl } from '@/lib/tmdb'

interface Props {
  movie: TMDBMovie
  status: FilmCardStatus
  onClick: () => void
}

export default function FilmPoster({ movie, status, onClick }: Props) {
  const poster = posterUrl(movie.poster_path)
  return (
    <button
      onClick={onClick}
      className="relative flex-shrink-0 w-32 aspect-[2/3] rounded-lg overflow-hidden bg-bg-elevated border border-transparent hover:border-cinema-red hover:scale-105 transition-all duration-200 group"
    >
      {poster ? (
        <Image src={poster} alt={movie.title} fill className="object-cover" sizes="128px" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-text-muted text-xs p-2 text-center">
          {movie.title}
        </div>
      )}
      {status.status === 'wishlist' && (
        <div className="absolute top-1.5 right-1.5 bg-cinema-red text-white text-xs w-5 h-5 rounded flex items-center justify-center font-bold">
          ♥
        </div>
      )}
      {status.status === 'watched' && status.score !== null && (
        <div className="absolute top-1.5 right-1.5 bg-black/70 text-white text-xs px-1 py-0.5 rounded font-semibold">
          {status.score}
        </div>
      )}
      {/* Always visible on mobile, hover-only on desktop */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
        <p className="text-white text-xs font-medium leading-tight line-clamp-2">{movie.title}</p>
      </div>
    </button>
  )
}
