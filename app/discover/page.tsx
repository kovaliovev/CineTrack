'use client'
import { useState, useEffect, useCallback } from 'react'
import AppShell from '@/components/layout/AppShell'
import FilmGrid from '@/components/films/FilmGrid'
import FilmDrawer from '@/components/films/FilmDrawer'
import GenrePills from '@/components/ui/GenrePills'
import SearchBar from '@/components/ui/SearchBar'
import { createClient } from '@/lib/supabase/client'
import type { TMDBMovie, TMDBGenre, FilmCardStatus } from '@/lib/types'

export default function DiscoverPage() {
  const [trending, setTrending] = useState<TMDBMovie[]>([])
  const [topRated, setTopRated] = useState<TMDBMovie[]>([])
  const [searchResults, setSearchResults] = useState<TMDBMovie[] | null>(null)
  const [genres, setGenres] = useState<TMDBGenre[]>([])
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null)
  const [genreFilms, setGenreFilms] = useState<TMDBMovie[]>([])
  const [statuses, setStatuses] = useState<Record<number, FilmCardStatus>>({})
  const [openFilmId, setOpenFilmId] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/tmdb/discover?type=trending').then(r => r.json()).then(setTrending)
    fetch('/api/tmdb/discover?type=top_rated').then(r => r.json()).then(setTopRated)
    fetch('/api/tmdb/discover?type=genres').then(r => r.json()).then(setGenres)
  }, [])

  useEffect(() => {
    if (selectedGenre === null) { setGenreFilms([]); return }
    fetch(`/api/tmdb/discover?type=genre&genre=${selectedGenre}`)
      .then(r => r.json()).then(setGenreFilms)
  }, [selectedGenre])

  // Load user statuses for visible films
  useEffect(() => {
    const allIds = [...trending, ...topRated, ...genreFilms, ...(searchResults ?? [])]
      .map(m => m.id)
    if (!allIds.length) return
    const supabase = createClient()
    supabase.from('user_films').select('tmdb_id, status, score')
      .in('tmdb_id', allIds)
      .then(({ data }) => {
        if (!data) return
        const map: Record<number, FilmCardStatus> = {}
        data.forEach(uf => { map[uf.tmdb_id] = { status: uf.status, score: uf.score } })
        setStatuses(prev => ({ ...prev, ...map }))
      })
  }, [trending, topRated, genreFilms, searchResults])

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) { setSearchResults(null); return }
    const res = await fetch(`/api/tmdb/search?q=${encodeURIComponent(query)}`)
    setSearchResults(await res.json())
  }, [])

  const showSearch = searchResults !== null
  const showGenre = !showSearch && selectedGenre !== null

  return (
    <AppShell>
      <div className="p-6 max-w-screen-2xl mx-auto">
        {/* Top bar */}
        <div className="flex items-center gap-4 mb-5 flex-wrap">
          <h1 className="text-lg font-bold tracking-wide">Discover</h1>
          <SearchBar onSearch={handleSearch} />
          {!showSearch && (
            <GenrePills genres={genres} selected={selectedGenre} onSelect={setSelectedGenre} />
          )}
        </div>

        {showSearch ? (
          <>
            <SectionLabel label="Search results" />
            <FilmGrid movies={searchResults!} statuses={statuses} onOpenDetail={setOpenFilmId} />
          </>
        ) : showGenre ? (
          <>
            <SectionLabel label={genres.find(g => g.id === selectedGenre)?.name ?? 'Genre'} />
            <FilmGrid movies={genreFilms} statuses={statuses} onOpenDetail={setOpenFilmId} />
          </>
        ) : (
          <>
            <SectionLabel label="Trending This Week" />
            <FilmGrid movies={trending} statuses={statuses} onOpenDetail={setOpenFilmId} />
            <SectionLabel label="Top Rated All Time" className="mt-8" />
            <FilmGrid movies={topRated} statuses={statuses} onOpenDetail={setOpenFilmId} />
          </>
        )}
      </div>

      {openFilmId && (
        <FilmDrawer tmdbId={openFilmId} onClose={() => setOpenFilmId(null)} />
      )}
    </AppShell>
  )
}

function SectionLabel({ label, className = '' }: { label: string; className?: string }) {
  return (
    <h2 className={`text-xs font-semibold text-text-muted uppercase tracking-widest mb-3 ${className}`}>
      {label}
    </h2>
  )
}
