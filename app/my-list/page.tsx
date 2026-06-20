'use client'
import { useState, useEffect } from 'react'
import AppShell from '@/components/layout/AppShell'
import FilmDrawer from '@/components/films/FilmDrawer'
import { createClient } from '@/lib/supabase/client'
import type { UserFilm } from '@/lib/types'

type Tab = 'watched' | 'wishlist'
type Sort = 'date' | 'score' | 'title'

export default function MyListPage() {
  const [tab, setTab] = useState<Tab>('watched')
  const [sort, setSort] = useState<Sort>('date')
  const [items, setItems] = useState<(UserFilm & { film: any })[]>([])
  const [openFilmId, setOpenFilmId] = useState<number | null>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.from('user_films')
      .select('*, film:films_cache(*)')
      .eq('status', tab)
      .then(({ data }) => setItems(data ?? []))
  }, [tab, supabase])

  const sorted = [...items].sort((a, b) => {
    if (sort === 'score') return (b.score ?? 0) - (a.score ?? 0)
    if (sort === 'title') return (a.film?.title ?? '').localeCompare(b.film?.title ?? '')
    return new Date(b.added_at).getTime() - new Date(a.added_at).getTime()
  })

  return (
    <AppShell>
      <div className="p-6 max-w-screen-xl mx-auto">
        <h1 className="text-lg font-bold mb-5">My List</h1>

        {/* Tabs */}
        <div className="flex gap-1 bg-bg-elevated rounded-lg p-1 w-fit mb-5">
          {(['watched', 'wishlist'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded text-sm font-medium transition-colors capitalize ${
                tab === t ? 'bg-cinema-red text-white' : 'text-text-secondary hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Sort controls */}
        <div className="flex gap-2 mb-5 items-center">
          <span className="text-xs text-text-muted">Sort:</span>
          {(['date', tab === 'watched' ? 'score' : null, 'title'] as (Sort | null)[])
            .filter(Boolean).map(s => (
              <button
                key={s!}
                onClick={() => setSort(s!)}
                className={`text-xs px-2.5 py-1 rounded transition-colors ${
                  sort === s ? 'bg-cinema-red text-white' : 'bg-bg-elevated text-text-secondary hover:text-white'
                }`}
              >
                {s === 'date' ? 'Date added' : s === 'score' ? 'Score' : 'Title'}
              </button>
            ))}
        </div>

        {/* List */}
        {sorted.length === 0 ? (
          <p className="text-text-muted text-sm">Nothing here yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {sorted.map(item => (
              <button
                key={item.id}
                onClick={() => setOpenFilmId(item.tmdb_id)}
                className="flex items-center gap-3 bg-bg-card hover:bg-bg-elevated border border-bg-border rounded-xl p-3 text-left transition-colors"
              >
                {item.film?.poster_url && (
                  <img src={item.film.poster_url} alt={item.film?.title} className="w-10 h-14 object-cover rounded" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.film?.title}</p>
                  <p className="text-xs text-text-muted mt-0.5">
                    {item.film?.year} · {item.film?.genres?.slice(0, 2).join(', ')}
                  </p>
                </div>
                {item.status === 'watched' && item.score !== null && (
                  <span className="text-cinema-red font-bold text-sm flex-shrink-0">{item.score}</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {openFilmId && <FilmDrawer tmdbId={openFilmId} onClose={() => setOpenFilmId(null)} />}
    </AppShell>
  )
}
