// components/couple/WishlistMatch.tsx
'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import FilmDrawer from '@/components/films/FilmDrawer'

export default function WishlistMatch({ partnerId }: { partnerId: string }) {
  const [matches, setMatches] = useState<any[]>([])
  const [openFilmId, setOpenFilmId] = useState<number | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [{ data: mine }, { data: partnerData }] = await Promise.all([
        supabase.from('user_films').select('tmdb_id').eq('status', 'wishlist').eq('user_id', user.id),
        supabase.from('user_films').select('tmdb_id').eq('status', 'wishlist').eq('user_id', partnerId),
      ])

      const myIds = new Set((mine ?? []).map((r: any) => r.tmdb_id))
      const matchIds = (partnerData ?? []).map((r: any) => r.tmdb_id).filter((id: number) => myIds.has(id))

      if (!matchIds.length) { setMatches([]); return }

      const { data: films } = await supabase.from('films_cache').select('*').in('tmdb_id', matchIds)
      setMatches(films ?? [])
    }
    load()
  }, [partnerId, supabase])

  if (matches.length === 0) {
    return <p className="text-text-muted text-sm">No wishlist matches yet. Add the same film to both wishlists to see it here.</p>
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {matches.map((film: any) => (
          <button
            key={film.tmdb_id}
            onClick={() => setOpenFilmId(film.tmdb_id)}
            className="bg-bg-card border border-cinema-red-border rounded-xl overflow-hidden text-left hover:border-cinema-red transition-colors"
          >
            {film.poster_url && (
              <img src={film.poster_url} alt={film.title} className="w-full aspect-[2/3] object-cover" />
            )}
            <div className="p-2.5">
              <p className="text-sm font-medium truncate">{film.title}</p>
              <p className="text-xs text-text-muted">{film.year}</p>
            </div>
          </button>
        ))}
      </div>
      {openFilmId && <FilmDrawer tmdbId={openFilmId} onClose={() => setOpenFilmId(null)} onOpenFilm={setOpenFilmId} />}
    </>
  )
}
