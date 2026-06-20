'use client'
import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import FilmGrid from '@/components/films/FilmGrid'
import FilmDrawer from '@/components/films/FilmDrawer'
import FilterBar from '@/components/ui/FilterBar'
import { createClient } from '@/lib/supabase/client'
import type { TMDBMovie, TMDBGenre, FilmCardStatus } from '@/lib/types'

function ExplorePageInner() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') ?? ''

  const [films, setFilms]               = useState<TMDBMovie[]>([])
  const [page, setPage]                 = useState(1)
  const [totalPages, setTotalPages]     = useState(1)
  const [loading, setLoading]           = useState(false)
  const [loadingMore, setLoadingMore]   = useState(false)
  const [genres, setGenres]             = useState<TMDBGenre[]>([])
  const [selectedGenre, setSelectedGenre]   = useState<number | null>(null)
  const [selectedDecade, setSelectedDecade] = useState<number | null>(null)
  const [sort, setSort]                 = useState('popularity.desc')
  const [searchInput, setSearchInput]   = useState(initialQuery)
  const [searchQuery, setSearchQuery]   = useState(initialQuery)
  const [statuses, setStatuses]         = useState<Record<number, FilmCardStatus>>({})
  const [openFilmId, setOpenFilmId]     = useState<number | null>(null)
  const [userId, setUserId]             = useState<string | null>(null)
  const sentinelRef  = useRef<HTMLDivElement>(null)
  const fetchingRef  = useRef(false)

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id)
    })
  }, [])

  // Debounce search input → searchQuery
  useEffect(() => {
    const t = setTimeout(() => setSearchQuery(searchInput), 400)
    return () => clearTimeout(t)
  }, [searchInput])

  // Fetch genres once
  useEffect(() => {
    fetch('/api/tmdb/discover?type=genres')
      .then(r => r.json())
      .then(data => setGenres(Array.isArray(data) ? data : []))
  }, [])

  const fetchPage = useCallback(async (p: number, replace = false) => {
    if (replace) setLoading(true)
    else setLoadingMore(true)

    let url: string
    if (searchQuery.trim()) {
      url = `/api/tmdb/search?q=${encodeURIComponent(searchQuery.trim())}`
    } else {
      const params = new URLSearchParams({ type: 'discover', sort, page: String(p) })
      if (selectedGenre)  params.set('genre',  String(selectedGenre))
      if (selectedDecade) params.set('decade', String(selectedDecade))
      url = `/api/tmdb/discover?${params}`
    }

    const res  = await fetch(url)
    const data = await res.json()

    const results: TMDBMovie[] = Array.isArray(data) ? data : (data.results ?? [])
    const tp: number = data.total_pages ?? 1

    setFilms(prev => replace ? results : [...prev, ...results])
    setTotalPages(tp)
    setPage(p)
    setLoading(false)
    setLoadingMore(false)
    fetchingRef.current = false
  }, [selectedGenre, selectedDecade, sort, searchQuery])

  useEffect(() => {
    fetchingRef.current = false
    fetchPage(1, true)
  }, [selectedGenre, selectedDecade, sort, searchQuery, fetchPage])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !fetchingRef.current) {
        setPage(prev => {
          if (prev >= totalPages) return prev
          fetchingRef.current = true
          fetchPage(prev + 1)
          return prev
        })
      }
    }, { rootMargin: '200px' })
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [totalPages, fetchPage])

  useEffect(() => {
    if (!userId) return
    const ids = films.map(m => m.id)
    if (!ids.length) return
    const supabase = createClient()
    supabase.from('user_films').select('tmdb_id, status, score').eq('user_id', userId).in('tmdb_id', ids)
      .then(({ data }) => {
        if (!data) return
        const map: Record<number, FilmCardStatus> = {}
        data.forEach(uf => { map[uf.tmdb_id] = { status: uf.status, score: uf.score } })
        setStatuses(prev => ({ ...prev, ...map }))
      })
  }, [films])

  const pageTitle = searchQuery ? `Results for "${searchQuery}"` : 'Explore'

  return (
    <AppShell>
      <div className="p-4 sm:p-6 max-w-screen-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <a href="/discover" className="text-text-muted hover:text-white transition-colors text-sm">← Discover</a>
          <span className="text-text-muted">/</span>
          <h1 className="text-lg font-bold">{pageTitle}</h1>
        </div>

        {/* Search — debounced, no submit button */}
        <div className="relative max-w-sm mb-4">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M9.5 9.5L13 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Search films…"
            className="w-full bg-bg-elevated border border-bg-border rounded-lg pl-9 pr-8 py-2 text-sm outline-none focus:border-cinema-red transition-colors"
          />
          {searchInput && (
            <button
              onClick={() => { setSearchInput(''); setSearchQuery('') }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-white transition-colors"
              aria-label="Clear search"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          )}
        </div>

        {/* Filter bar — hidden during search */}
        {!searchQuery && (
          <div className="mb-6">
            <FilterBar
              genres={genres}
              selectedGenre={selectedGenre}
              onGenreChange={setSelectedGenre}
              selectedDecade={selectedDecade}
              onDecadeChange={setSelectedDecade}
              sort={sort}
              onSortChange={setSort}
            />
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center h-64 text-text-muted text-sm">Loading…</div>
        ) : (
          <>
            <FilmGrid movies={films} statuses={statuses} onOpenDetail={setOpenFilmId} />
            <div ref={sentinelRef} className="h-16 flex items-center justify-center">
              {loadingMore && <p className="text-text-muted text-sm">Loading…</p>}
              {!loadingMore && page >= totalPages && films.length > 0 && (
                <p className="text-text-muted text-xs">All films loaded</p>
              )}
            </div>
          </>
        )}

        {openFilmId && <FilmDrawer tmdbId={openFilmId} onClose={() => setOpenFilmId(null)} />}
      </div>
    </AppShell>
  )
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-bg-base" />}>
      <ExplorePageInner />
    </Suspense>
  )
}
