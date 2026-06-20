'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import FilmRow from '@/components/films/FilmRow'
import FilmDrawer from '@/components/films/FilmDrawer'
import { createClient } from '@/lib/supabase/client'
import type { TMDBMovie, FilmCardStatus } from '@/lib/types'

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

const rows = [
  { title: 'Trending This Week', key: 'trending' as const },
  { title: 'In Theaters Now',    key: 'nowPlaying' as const },
  { title: 'Coming Soon',        key: 'upcoming' as const },
  { title: 'All-Time Classics',  key: 'classics' as const },
  { title: 'Hidden Gems',        key: 'hiddenGems' as const },
  { title: 'Recent Favorites',   key: 'recent' as const },
]

export default function DiscoverPage() {
  const router = useRouter()
  const [sections, setSections] = useState<Sections>(EMPTY)
  const [statuses, setStatuses] = useState<Record<number, FilmCardStatus>>({})
  const [openFilmId, setOpenFilmId] = useState<number | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [search, setSearch] = useState('')
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id)
    })
  }, [])

  useEffect(() => {
    Promise.all([
      fetch('/api/tmdb/discover?type=trending').then(r => r.json()),
      fetch('/api/tmdb/discover?type=now_playing').then(r => r.json()),
      fetch('/api/tmdb/discover?type=upcoming').then(r => r.json()),
      fetch('/api/tmdb/discover?type=classics').then(r => r.json()),
      fetch('/api/tmdb/discover?type=hidden_gems').then(r => r.json()),
      fetch('/api/tmdb/discover?type=recent').then(r => r.json()),
    ]).then(([trending, nowPlaying, upcoming, classics, hiddenGems, recent]) => {
      setSections({ trending, nowPlaying, upcoming, classics, hiddenGems, recent })
      setLoaded(true)
    })
  }, [])

  useEffect(() => {
    if (!userId) return
    const ids = Object.values(sections).flat().map(m => m.id)
    if (!ids.length) return
    const supabase = createClient()
    supabase.from('user_films').select('tmdb_id, status, score')
      .eq('user_id', userId)
      .in('tmdb_id', ids)
      .then(({ data }) => {
        if (!data) return
        const map: Record<number, FilmCardStatus> = {}
        data.forEach(uf => { map[uf.tmdb_id] = { status: uf.status, score: uf.score } })
        setStatuses(map)
      })
  }, [sections, userId])

  async function handleStatusChange(tmdbId: number, newStatus: FilmCardStatus) {
    setStatuses(prev => ({ ...prev, [tmdbId]: newStatus }))
    if (newStatus.status === null && userId) {
      await createClient().from('user_films').delete()
        .eq('tmdb_id', tmdbId)
        .eq('user_id', userId)
    }
  }

  function refreshStatuses() {
    if (!userId) return
    const ids = Object.values(sections).flat().map(m => m.id)
    if (!ids.length) return
    createClient().from('user_films').select('tmdb_id, status, score')
      .eq('user_id', userId)
      .in('tmdb_id', ids)
      .then(({ data }) => {
        if (!data) return
        const map: Record<number, FilmCardStatus> = {}
        data.forEach(uf => { map[uf.tmdb_id] = { status: uf.status, score: uf.score } })
        setStatuses(map)
      })
  }

  async function surpriseMe() {
    const res = await fetch('/api/tmdb/discover?type=surprise')
    const film = await res.json()
    if (film?.id) setOpenFilmId(film.id)
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (search.trim()) router.push(`/explore?q=${encodeURIComponent(search.trim())}`)
  }

  return (
    <AppShell>
      <div className="p-4 sm:p-6 max-w-screen-2xl mx-auto">

        {/* Search bar → redirects to Explore */}
        <div className="flex flex-col sm:flex-row gap-2 mb-8">
          <form onSubmit={handleSearchSubmit} className="flex gap-2 flex-1 sm:max-w-sm">
            <div className="flex-1 relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M9.5 9.5L13 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search films…"
                className="w-full bg-bg-elevated border border-bg-border rounded-lg pl-9 pr-4 py-2.5 text-sm outline-none focus:border-cinema-red transition-colors"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 bg-bg-elevated border border-bg-border rounded-lg text-sm text-text-secondary hover:text-white hover:border-cinema-red transition-colors"
            >
              Search
            </button>
          </form>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => router.push('/explore')}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-bg-elevated border border-bg-border rounded-lg text-sm text-text-secondary hover:text-white hover:border-cinema-red transition-colors"
            >
              Browse all →
            </button>
            <button
              type="button"
              onClick={surpriseMe}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-bg-elevated border border-bg-border rounded-lg text-sm text-text-secondary hover:text-white hover:border-cinema-red transition-colors"
            >
              Surprise me
            </button>
          </div>
        </div>

        {/* Rows */}
        {!loaded
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="mb-8">
                <div className="h-4 bg-bg-elevated rounded w-40 animate-pulse mb-3" />
                <div className="flex gap-3">
                  {Array.from({ length: 7 }).map((_, j) => (
                    <div key={j} className="flex-shrink-0 w-32 aspect-[2/3] rounded-lg bg-bg-elevated animate-pulse" />
                  ))}
                </div>
              </div>
            ))
          : rows.map(({ title, key }) => (
              <FilmRow
                key={key}
                title={title}
                movies={sections[key]}
                statuses={statuses}
                onOpenDetail={setOpenFilmId}
                seeAllHref="/explore"
                onStatusChange={handleStatusChange}
              />
            ))
        }

        {openFilmId && (
          <FilmDrawer tmdbId={openFilmId} onClose={() => { setOpenFilmId(null); refreshStatuses() }} onOpenFilm={setOpenFilmId} />
        )}
      </div>
    </AppShell>
  )
}
