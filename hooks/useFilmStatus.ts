'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { FilmCardStatus, Film } from '@/lib/types'

export function useFilmStatus(
  tmdbId: number,
  initialStatus: FilmCardStatus,
  film: Pick<Film, 'title' | 'poster_url' | 'year' | 'genres'>
) {
  const [status, setStatus] = useState<FilmCardStatus>(initialStatus)
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id)
    })
  }, [supabase])

  const ensureCached = useCallback(async () => {
    await supabase.from('films_cache').upsert(
      { tmdb_id: tmdbId, title: film.title, poster_url: film.poster_url,
        year: film.year, genres: film.genres },
      { onConflict: 'tmdb_id', ignoreDuplicates: true }
    )
  }, [tmdbId, film, supabase])

  const addToWishlist = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    await ensureCached()
    const { error } = await supabase.from('user_films').upsert(
      { tmdb_id: tmdbId, status: 'wishlist', score: null, user_id: userId },
      { onConflict: 'user_id,tmdb_id' }
    )
    if (!error) setStatus({ status: 'wishlist', score: null })
    setLoading(false)
  }, [tmdbId, userId, ensureCached, supabase])

  const markWatched = useCallback(async (score: number) => {
    if (!userId) return
    setLoading(true)
    await ensureCached()
    const { error } = await supabase.from('user_films').upsert(
      { tmdb_id: tmdbId, status: 'watched', score, user_id: userId },
      { onConflict: 'user_id,tmdb_id' }
    )
    if (!error) setStatus({ status: 'watched', score })
    setLoading(false)
  }, [tmdbId, userId, ensureCached, supabase])

  const removeFromList = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    await supabase.from('user_films').delete()
      .eq('tmdb_id', tmdbId)
      .eq('user_id', userId)
    setStatus({ status: null, score: null })
    setLoading(false)
  }, [tmdbId, userId, supabase])

  return { status, loading, addToWishlist, markWatched, removeFromList }
}
