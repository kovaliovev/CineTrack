'use client'
import { useState, useEffect, useCallback } from 'react'
import AppShell from '@/components/layout/AppShell'
import FilmRow from '@/components/films/FilmRow'
import FilmGrid from '@/components/films/FilmGrid'
import FilmDrawer from '@/components/films/FilmDrawer'
import GenrePills from '@/components/ui/GenrePills'
import SearchBar from '@/components/ui/SearchBar'
import DecadeFilter from '@/components/ui/DecadeFilter'
import { createClient } from '@/lib/supabase/client'
import type { TMDBMovie, TMDBGenre, FilmCardStatus } from '@/lib/types'

type Sections = {
  trending: TMDBMovie[]
  popular: TMDBMovie[]
  nowPlaying: TMDBMovie[]
  upcoming: TMDBMovie[]
  topRated: TMDBMovie[]
  acclaimed: TMDBMovie[]
}

const EMPTY: Sections = {
  trending: [], popular: [], nowPlaying: [], upcoming: [], topRated: [], acclaimed: [],
}

export default function DiscoverPage() {
  const [sections, setSections] = useState<Sections>(EMPTY)
  const [genres, setGenres] = useState<TMDBGenre[]>([])
  const [statuses, setStatuses] = useState<Record<number, FilmCardStatus>>({})
  const [openFilmId, setOpenFilmId] = useState<number | null>(null)

  // Filters — only one active at a time
  const [searchResults, setSearchResults] = useState<TMDBMovie[] | null>(null)
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null)
  const [selectedDecade, setSelectedDecade] = useState<number | null>(null)
  const [filterFilms, setFilterFilms] = useState<TMDBMovie[]>([])

  // Load all home rows + genres in parallel on mount
  useEffect(() => {
    const fetches = [
      fetch('/api/tmdb/discover?type=trending').then(r => r.json()),
      fetch('/api/tmdb/discover?type=popular').then(r => r.json()),
      fetch('/api/tmdb/discover?type=now_playing').then(r => r.json()),
      fetch('/api/tmdb/discover?type=upcoming').then(r => r.json()),
      fetch('/api/tmdb/discover?type=top_rated').then(r => r.json()),
      fetch('/api/tmdb/discover?type=acclaimed').then(r => r.json()),
      fetch('/api/tmdb/discover?type=genres').then(r => r.json()),
    ]
    Promise.all(fetches).then(([trending, popular, nowPlaying, upcoming, topRated, acclaimed, genreList]) => {
      setSections({ trending, popular, nowPlaying, upcoming, topRated, acclaimed })
      setGenres(Array.isArray(genreList) ? genreList : [])
    })
  }, [])

  // Load statuses from user_films whenever visible films change
  useEffect(() => {
    const inFilterMode = searchResults !== null || selectedGenre !== null || selectedDecade !== null
    const visible = inFilterMode
      ? filterFilms
      : [...sections.trending, ...sections.popular, ...sections.nowPlaying,
         ...sections.upcoming, ...sections.topRated, ...sections.acclaimed]
    const ids = visible.map(m => m.id)
    if (!ids.length) return
    const supabase = createClient()
    supabase.from('user_films').select('tmdb_id, status, score').in('tmdb_id', ids)
      .then(({ data }) => {
        if (!data) return
        const map: Record<number, FilmCardStatus> = {}
        data.forEach(uf => { map[uf.tmdb_id] = { status: uf.status, score: uf.score } })
        setStatuses(prev => ({ ...prev, ...map }))
      })
  }, [sections, filterFilms, searchResults, selectedGenre, selectedDecade])

  // Genre filter
  useEffect(() => {
    if (selectedGenre === null) return
    setSelectedDecade(null)
    setSearchResults(null)
    fetch(`/api/tmdb/discover?type=genre&genre=${selectedGenre}`)
      .then(r => r.json()).then(data => setFilterFilms(Array.isArray(data) ? data : []))
  }, [selectedGenre])

  // Decade filter
  useEffect(() => {
    if (selectedDecade === null) return
    setSelectedGenre(null)
    setSearchResults(null)
    fetch(`/api/tmdb/discover?type=decade&decade=${selectedDecade}`)
      .then(r => r.json()).then(data => setFilterFilms(Array.isArray(data) ? data : []))
  }, [selectedDecade])

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) { setSearchResults(null); return }
    setSelectedGenre(null)
    setSelectedDecade(null)
    const res = await fetch(`/api/tmdb/search?q=${encodeURIComponent(query)}`)
    const data = await res.json()
    setSearchResults(Array.isArray(data) ? data : [])
  }, [])

  function handleGenreChange(g: number | null) {
    setSelectedGenre(g)
    if (g === null) setFilterFilms([])
  }

  function handleDecadeChange(d: number | null) {
    setSelectedDecade(d)
    if (d === null) setFilterFilms([])
  }

  async function surpriseMe() {
    const pool = sections.acclaimed.length ? sections.acclaimed : sections.topRated
    if (!pool.length) return
    const pick = pool[Math.floor(Math.random() * pool.length)]
    setOpenFilmId(pick.id)
  }

  const filterMode = searchResults !== null || selectedGenre !== null || selectedDecade !== null
  const gridFilms = searchResults ?? filterFilms

  // Section rows config
  const rows = [
    { title: 'Trending This Week', movies: sections.trending },
    { title: 'Popular Right Now', movies: sections.popular },
    { title: 'Now Playing', movies: sections.nowPlaying },
    { title: 'Coming Soon', movies: sections.upcoming },
    { title: 'Critically Acclaimed', movies: sections.acclaimed },
    { title: 'All-Time Top Rated', movies: sections.topRated },
  ]

  return (
    <AppShell>
      <div className="p-6 max-w-screen-2xl mx-auto">
        {/* Top bar */}
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <SearchBar onSearch={handleSearch} />
            </div>
            <button
              onClick={surpriseMe}
              className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 bg-bg-elevated border border-bg-border rounded-lg text-sm text-text-secondary hover:text-white hover:border-cinema-red transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M1 1h3l1 2H1V1zm9 0h3v2h-4l1-2zm3 10h-3l-1 2h4v-2zM1 11h3l-1 2H1v-2zM4 6.5l3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="7" cy="4" r="1" fill="currentColor"/>
              </svg>
              Surprise Me
            </button>
          </div>

          <GenrePills genres={genres} selected={selectedGenre} onSelect={handleGenreChange} />
          <DecadeFilter selected={selectedDecade} onChange={handleDecadeChange} />
        </div>

        {/* Content */}
        {filterMode ? (
          <div>
            {searchResults !== null && (
              <p className="text-xs text-text-muted mb-4">
                {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
              </p>
            )}
            <FilmGrid
              movies={gridFilms}
              statuses={statuses}
              onOpenDetail={setOpenFilmId}
            />
          </div>
        ) : (
          rows.map(({ title, movies }) => (
            <FilmRow
              key={title}
              title={title}
              movies={movies}
              statuses={statuses}
              onOpenDetail={setOpenFilmId}
            />
          ))
        )}

        {openFilmId && (
          <FilmDrawer tmdbId={openFilmId} onClose={() => setOpenFilmId(null)} />
        )}
      </div>
    </AppShell>
  )
}
