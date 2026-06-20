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
  { title: 'Trending This Week', key: 'trending' as const, type: 'trending' },
  { title: 'In Theaters Now',    key: 'nowPlaying' as const, type: 'now_playing' },
  { title: 'Coming Soon',        key: 'upcoming' as const, type: 'upcoming' },
  { title: 'All-Time Classics',  key: 'classics' as const, type: 'classics' },
  { title: 'Hidden Gems',        key: 'hiddenGems' as const, type: 'hidden_gems' },
  { title: 'Recent Favorites',   key: 'recent' as const, type: 'recent' },
]

export default function DiscoverPage() {
  const router = useRouter()
  const [sections, setSections] = useState<Sections>(EMPTY)
  const [statuses, setStatuses] = useState<Record<number, FilmCardStatus>>({})
  const [openFilmId, setOpenFilmId] = useState<number | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [search, setSearch] = useState('')

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
    const allFilms = Object.values(sections).flat()
    const ids = allFilms.map(m => m.id)
    if (!ids.length) return
    const supabase = createClient()
    supabase.from('user_films').select('tmdb_id, status, score').in('tmdb_id', ids)
      .then(({ data }) => {
        if (!data) return
        const map: Record<number, FilmCardStatus> = {}
        data.forEach(uf => { map[uf.tmdb_id] = { status: uf.status, score: uf.score } })
        setStatuses(map)
      })
  }, [sections])

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
      <div className="p-6 max-w-screen-2xl mx-auto">

        {/* Search bar → redirects to Explore */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2 mb-8">
          <div className="flex-1 relative max-w-sm">
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
          <button
            type="button"
            onClick={() => router.push('/explore')}
            className="px-4 py-2.5 bg-bg-elevated border border-bg-border rounded-lg text-sm text-text-secondary hover:text-white hover:border-cinema-red transition-colors"
          >
            Browse all →
          </button>
          <button
            type="button"
            onClick={surpriseMe}
            className="px-4 py-2.5 bg-bg-elevated border border-bg-border rounded-lg text-sm text-text-secondary hover:text-white hover:border-cinema-red transition-colors"
          >
            Surprise me
          </button>
        </form>

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
          : rows.map(({ title, key, type }) => (
              <FilmRow
                key={type}
                title={title}
                movies={sections[key]}
                statuses={statuses}
                onOpenDetail={setOpenFilmId}
                seeAllHref="/explore"
              />
            ))
        }

        {openFilmId && (
          <FilmDrawer tmdbId={openFilmId} onClose={() => setOpenFilmId(null)} />
        )}
      </div>
    </AppShell>
  )
}
