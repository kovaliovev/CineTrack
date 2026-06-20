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
  nowPlaying: TMDBMovie[]
  upcoming: TMDBMovie[]
  classics: TMDBMovie[]
  hiddenGems: TMDBMovie[]
  recent: TMDBMovie[]
}

const EMPTY: Sections = {
  trending: [], nowPlaying: [], upcoming: [], classics: [], hiddenGems: [], recent: [],
}

export default function DiscoverPage() {
  const [sections, setSections] = useState<Sections>(EMPTY)
  const [genres, setGenres] = useState<TMDBGenre[]>([])
  const [statuses, setStatuses] = useState<Record<number, FilmCardStatus>>({})
  const [openFilmId, setOpenFilmId] = useState<number | null>(null)
  const [sectionsLoaded, setSectionsLoaded] = useState(false)

  // Filters — only one active at a time
  const [searchResults, setSearchResults] = useState<TMDBMovie[] | null>(null)
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null)
  const [selectedDecade, setSelectedDecade] = useState<number | null>(null)
  const [filterFilms, setFilterFilms] = useState<TMDBMovie[]>([])

  // Load all home rows + genres in parallel on mount
  useEffect(() => {
    Promise.all([
      fetch('/api/tmdb/discover?type=trending').then(r => r.json()),
      fetch('/api/tmdb/discover?type=now_playing').then(r => r.json()),
      fetch('/api/tmdb/discover?type=upcoming').then(r => r.json()),
      fetch('/api/tmdb/discover?type=classics').then(r => r.json()),
      fetch('/api/tmdb/discover?type=hidden_gems').then(r => r.json()),
      fetch('/api/tmdb/discover?type=recent').then(r => r.json()),
      fetch('/api/tmdb/discover?type=genres').then(r => r.json()),
    ]).then(([trending, nowPlaying, upcoming, classics, hiddenGems, recent, genreList]) => {
      setSections({ trending, nowPlaying, upcoming, classics, hiddenGems, recent })
      setSectionsLoaded(true)
      setGenres(Array.isArray(genreList) ? genreList : [])
    })
  }, [])

  // Load statuses from user_films whenever visible films change
  useEffect(() => {
    const inFilterMode = searchResults !== null || selectedGenre !== null || selectedDecade !== null
    const visible = inFilterMode
      ? filterFilms
      : [...sections.trending, ...sections.nowPlaying, ...sections.upcoming,
         ...sections.classics, ...sections.hiddenGems, ...sections.recent]
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
    const res = await fetch('/api/tmdb/discover?type=surprise')
    const film = await res.json()
    if (film?.id) setOpenFilmId(film.id)
  }

  const filterMode = searchResults !== null || selectedGenre !== null || selectedDecade !== null
  const gridFilms = searchResults ?? filterFilms

  // Section rows config
  const rows = [
    { title: 'Trending This Week', movies: sections.trending, type: 'trending' },
    { title: 'In Theaters Now', movies: sections.nowPlaying, type: 'now_playing' },
    { title: 'Coming Soon', movies: sections.upcoming, type: 'upcoming' },
    { title: 'All-Time Classics', movies: sections.classics, type: 'classics' },
    { title: 'Hidden Gems', movies: sections.hiddenGems, type: 'hidden_gems' },
    { title: 'Recent Favorites', movies: sections.recent, type: 'recent' },
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
          !sectionsLoaded
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="mb-8">
                  <div className="flex items-center justify-between mb-3">
                    <div className="h-4 bg-bg-elevated rounded w-40 animate-pulse" />
                  </div>
                  <div className="flex gap-3">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <div key={j} className="flex-shrink-0 w-32 aspect-[2/3] rounded-lg bg-bg-elevated animate-pulse" />
                    ))}
                  </div>
                </div>
              ))
            : rows.map(({ title, movies, type }) => (
                <FilmRow
                  key={title}
                  title={title}
                  movies={movies}
                  statuses={statuses}
                  onOpenDetail={setOpenFilmId}
                  seeAllHref={`/explore?type=${type}`}
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
