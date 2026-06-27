'use client'
import { useState, useEffect } from 'react'
import FilmDrawer from '@/components/films/FilmDrawer'

interface Suggestion {
  film: { tmdb_id: number; title: string; poster_url: string | null; year: number | null }
  reason: string
}

export default function SimilarSection({ partnerId }: { partnerId: string }) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [openFilmId, setOpenFilmId] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/couple/similar?partnerId=${partnerId}`)
      .then(r => r.json())
      .then(data => {
        if (!cancelled) {
          setSuggestions(Array.isArray(data) ? data : [])
          setLoading(false)
        }
      })
      .catch(() => { if (!cancelled) { setError(true); setLoading(false) } })
    return () => { cancelled = true }
  }, [partnerId])

  if (loading) return <p className="text-text-muted text-sm">Finding suggestions…</p>
  if (error) return <p className="text-text-muted text-sm">Couldn&apos;t load suggestions right now.</p>
  if (suggestions.length === 0) {
    return (
      <p className="text-text-muted text-sm">
        Rate films you&apos;ve both watched to get suggestions here.
      </p>
    )
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {suggestions.map(({ film, reason }) => (
          <button
            key={film.tmdb_id}
            onClick={() => setOpenFilmId(film.tmdb_id)}
            className="bg-bg-card border border-bg-border rounded-xl overflow-hidden text-left hover:border-cinema-red transition-colors"
          >
            {film.poster_url && (
              <img src={film.poster_url} alt={film.title} className="w-full aspect-[2/3] object-cover" />
            )}
            <div className="p-2.5">
              <p className="text-sm font-medium truncate">{film.title}</p>
              {film.year && <p className="text-xs text-text-muted">{film.year}</p>}
              <p className="text-xs text-cinema-red mt-1 truncate">{reason}</p>
            </div>
          </button>
        ))}
      </div>
      {openFilmId && (
        <FilmDrawer
          tmdbId={openFilmId}
          onClose={() => setOpenFilmId(null)}
          onOpenFilm={setOpenFilmId}
        />
      )}
    </>
  )
}
