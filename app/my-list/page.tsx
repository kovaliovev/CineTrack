'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import AppShell from '@/components/layout/AppShell'
import FilmDrawer from '@/components/films/FilmDrawer'
import { createClient } from '@/lib/supabase/client'
import type { UserFilm, Film } from '@/lib/types'

type Tab = 'watched' | 'wishlist'
type Sort = 'date' | 'score' | 'title'

type ListItem = UserFilm & { film: Film | null }

export default function MyListPage() {
  const [tab, setTab]           = useState<Tab>('watched')
  const [sort, setSort]         = useState<Sort>('date')
  const [allItems, setAllItems] = useState<ListItem[]>([])
  const [openFilmId, setOpenFilmId] = useState<number | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const supabase = createClient()

  function loadItems(uid: string) {
    supabase.from('user_films')
      .select('*, film:films_cache(*)')
      .eq('user_id', uid)
      .order('added_at', { ascending: false })
      .then(({ data }) => setAllItems((data ?? []) as ListItem[]))
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return
      setUserId(data.user.id)
      loadItems(data.user.id)
    })
  }, [supabase])

  async function remove(id: string) {
    await supabase.from('user_films').delete().eq('id', id)
    setAllItems(prev => prev.filter(i => i.id !== id))
  }

  const watched  = allItems.filter(i => i.status === 'watched')
  const wishlist = allItems.filter(i => i.status === 'wishlist')
  const items    = tab === 'watched' ? watched : wishlist

  const sorted = [...items].sort((a, b) => {
    if (sort === 'score') return (b.score ?? 0) - (a.score ?? 0)
    if (sort === 'title') return (a.film?.title ?? '').localeCompare(b.film?.title ?? '')
    return new Date(b.added_at).getTime() - new Date(a.added_at).getTime()
  })

  return (
    <AppShell>
      <div className="p-4 sm:p-6 max-w-screen-xl mx-auto">
        <h1 className="text-lg font-bold mb-5">My List</h1>

        {/* Tabs with counts */}
        <div className="flex gap-1 bg-bg-elevated rounded-lg p-1 w-fit mb-5">
          {([
            { key: 'watched',  label: 'Watched',  count: watched.length },
            { key: 'wishlist', label: 'Wishlist', count: wishlist.length },
          ] as { key: Tab; label: string; count: number }[]).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded text-sm font-medium transition-colors ${
                tab === t.key ? 'bg-cinema-red text-white' : 'text-text-secondary hover:text-white'
              }`}
            >
              {t.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                tab === t.key ? 'bg-white/20' : 'bg-bg-base text-text-muted'
              }`}>
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {/* Sort controls */}
        <div className="flex gap-2 mb-5 items-center">
          <span className="text-xs text-text-muted">Sort:</span>
          {([
            { key: 'date',  label: 'Date added' },
            ...(tab === 'watched' ? [{ key: 'score', label: 'Score' }] : []),
            { key: 'title', label: 'Title' },
          ] as { key: Sort; label: string }[]).map(s => (
            <button
              key={s.key}
              onClick={() => setSort(s.key)}
              className={`text-xs px-2.5 py-1 rounded transition-colors ${
                sort === s.key
                  ? 'bg-cinema-red text-white'
                  : 'bg-bg-elevated text-text-secondary hover:text-white'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* List */}
        {sorted.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-text-muted text-sm mb-3">
              {tab === 'watched' ? 'No watched films yet.' : 'Your wishlist is empty.'}
            </p>
            <Link
              href="/discover"
              className="text-xs text-cinema-red hover:underline"
            >
              Browse Discover →
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {sorted.map(item => (
              <div
                key={item.id}
                className="flex items-center gap-3 bg-bg-card hover:bg-bg-elevated border border-bg-border rounded-xl p-3 transition-colors group"
              >
                <button
                  onClick={() => setOpenFilmId(item.tmdb_id)}
                  className="flex items-center gap-3 flex-1 min-w-0 text-left"
                >
                  {item.film?.poster_url ? (
                    <img
                      src={item.film.poster_url}
                      alt={item.film.title ?? ''}
                      className="w-10 h-14 object-cover rounded flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-14 rounded bg-bg-elevated flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.film?.title}</p>
                    <p className="text-xs text-text-muted mt-0.5">
                      {item.film?.year}
                      {item.film?.genres?.length ? ` · ${item.film.genres.slice(0, 2).join(', ')}` : ''}
                    </p>
                  </div>
                </button>

                <div className="flex items-center gap-3 flex-shrink-0">
                  {item.status === 'watched' && item.score !== null && (
                    <span className="text-cinema-red font-bold text-sm w-6 text-center">
                      {item.score}
                    </span>
                  )}
                  {item.status === 'wishlist' && (
                    <span className="text-cinema-red text-sm">♥</span>
                  )}
                  <button
                    onClick={() => remove(item.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-text-muted hover:text-red-400 p-1 rounded"
                    aria-label="Remove from list"
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                      <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {openFilmId && <FilmDrawer tmdbId={openFilmId} onClose={() => {
        setOpenFilmId(null)
        if (userId) loadItems(userId)
      }} />}
    </AppShell>
  )
}
