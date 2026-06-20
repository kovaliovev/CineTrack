'use client'
import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { FilmCardStatus, Film } from '@/lib/types'

export function useFilmStatus(
  tmdbId: number,
  initialStatus: FilmCardStatus,
  film: Pick<Film, 'title' | 'poster_url' | 'year' | 'genres'>
) {
  const [status, setStatus] = useState<FilmCardStatus>(initialStatus)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const ensureCached = useCallback(async () => {
    await supabase.from('films_cache').upsert(
      { tmdb_id: tmdbId, title: film.title, poster_url: film.poster_url,
        year: film.year, genres: film.genres },
      { onConflict: 'tmdb_id', ignoreDuplicates: true }
    )
  }, [tmdbId, film, supabase])

  const addToWishlist = useCallback(async () => {
    setLoading(true)
    await ensureCached()
    const { error } = await supabase.from('user_films').upsert(
      { tmdb_id: tmdbId, status: 'wishlist', score: null },
      { onConflict: 'user_id,tmdb_id' }
    )
    if (!error) setStatus({ status: 'wishlist', score: null })
    setLoading(false)
  }, [tmdbId, ensureCached, supabase])

  const markWatched = useCallback(async (score: number) => {
    setLoading(true)
    await ensureCached()
    const { error } = await supabase.from('user_films').upsert(
      { tmdb_id: tmdbId, status: 'watched', score },
      { onConflict: 'user_id,tmdb_id' }
    )
    if (!error) setStatus({ status: 'watched', score })
    setLoading(false)
  }, [tmdbId, ensureCached, supabase])

  const removeFromList = useCallback(async () => {
    setLoading(true)
    await supabase.from('user_films').delete()
      .eq('tmdb_id', tmdbId)
    setStatus({ status: null, score: null })
    setLoading(false)
  }, [tmdbId, supabase])

  return { status, loading, addToWishlist, markWatched, removeFromList }
}
