'use client'
import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import FilmGrid from '@/components/films/FilmGrid'
import FilmDrawer from '@/components/films/FilmDrawer'
import GenrePills from '@/components/ui/GenrePills'
import DecadeFilter from '@/components/ui/DecadeFilter'
import { createClient } from '@/lib/supabase/client'
import type { TMDBMovie, TMDBGenre, FilmCardStatus } from '@/lib/types'

const SORT_OPTIONS = [
  { label: 'Popularity', value: 'popularity.desc' },
  { label: 'Rating', value: 'vote_average.desc' },
  { label: 'Newest', value: 'primary_release_date.desc' },
  { label: 'Oldest', value: 'primary_release_date.asc' },
]

const TYPE_LABELS: Record<string, string> = {
  trending: 'Trending This Week',
  now_playing: 'In Theaters Now',
  upcoming: 'Coming Soon',
  classics: 'All-Time Classics',
  hidden_gems: 'Hidden Gems',
  recent: 'Recent Favorites',
}

function ExplorePageInner() {
  const searchParams = useSearchParams()
  const initialType = searchParams.get('type') ?? ''

  const [films, setFilms] = useState<TMDBMovie[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [genres, setGenres] = useState<TMDBGenre[]>([])
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null)
  const [selectedDecade, setSelectedDecade] = useState<number | null>(null)
  const [sort, setSort] = useState('popularity.desc')
  const [statuses, setStatuses] = useState<Record<number, FilmCardStatus>>({})
  const [openFilmId, setOpenFilmId] = useState<number | null>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const fetchingRef = useRef(false)

  // Fetch genres on mount
  useEffect(() => {
    fetch('/api/tmdb/discover?type=genres').then(r => r.json()).then(data => {
      setGenres(Array.isArray(data) ? data : [])
    })
  }, [])

  // If initial type is a curated section (not discover), load it directly
  const isCurated = initialType && initialType !== 'discover' && TYPE_LABELS[initialType]

  const fetchPage = useCallback(async (p: number, replace = false) => {
    if (replace) setLoading(true)
    else setLoadingMore(true)

    let url: string
    if (isCurated && p === 1 && !selectedGenre && !selectedDecade) {
      url = `/api/tmdb/discover?type=${initialType}`
    } else {
      const params = new URLSearchParams({
        type: 'discover',
        sort,
        page: String(p),
      })
      if (selectedGenre) params.set('genre', String(selectedGenre))
      if (selectedDecade) params.set('decade', String(selectedDecade))
      url = `/api/tmdb/discover?${params}`
    }

    const res = await fetch(url)
    const data = await res.json()

    const results: TMDBMovie[] = Array.isArray(data) ? data : (data.results ?? [])
    const tp: number = data.total_pages ?? 1

    setFilms(prev => replace ? results : [...prev, ...results])
    setTotalPages(tp)
    setPage(p)
    setLoading(false)
    setLoadingMore(false)
    fetchingRef.current = false
  }, [isCurated, initialType, selectedGenre, selectedDecade, sort])

  // Reload when filters change
  useEffect(() => {
    fetchingRef.current = false
    fetchPage(1, true)
  }, [selectedGenre, selectedDecade, sort, fetchPage])

  // Infinite scroll — observe sentinel div at bottom
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

  // Update statuses
  useEffect(() => {
    const ids = films.map(m => m.id)
    if (!ids.length) return
    const supabase = createClient()
    supabase.from('user_films').select('tmdb_id, status, score').in('tmdb_id', ids)
      .then(({ data }) => {
        if (!data) return
        const map: Record<number, FilmCardStatus> = {}
        data.forEach(uf => { map[uf.tmdb_id] = { status: uf.status, score: uf.score } })
        setStatuses(prev => ({ ...prev, ...map }))
      })
  }, [films])

  const title = TYPE_LABELS[initialType] ?? 'Explore'

  return (
    <AppShell>
      <div className="p-6 max-w-screen-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <a href="/discover" className="text-text-muted hover:text-white transition-colors text-sm">← Discover</a>
          <span className="text-text-muted">/</span>
          <h1 className="text-lg font-bold">{title}</h1>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 mb-6">
          {/* Sort */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-text-muted">Sort:</span>
            {SORT_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setSort(opt.value)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  sort === opt.value
                    ? 'bg-cinema-red text-white'
                    : 'bg-bg-elevated text-text-secondary hover:text-white border border-bg-border'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <GenrePills genres={genres} selected={selectedGenre} onSelect={g => { setSelectedGenre(g) }} />
          <DecadeFilter selected={selectedDecade} onChange={setSelectedDecade} />
        </div>

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
