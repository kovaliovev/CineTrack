'use client'
import { useState, useEffect } from 'react'
import AppShell from '@/components/layout/AppShell'
import FilmDrawer from '@/components/films/FilmDrawer'
import { createClient } from '@/lib/supabase/client'
import { useCouple } from '@/hooks/useCouple'

type Tab = 'watched' | 'wishlist'

export default function HerListPage() {
  const [tab, setTab] = useState<Tab>('watched')
  const [items, setItems] = useState<any[]>([])
  const [openFilmId, setOpenFilmId] = useState<number | null>(null)
  const { partnerId, loading } = useCouple()
  const supabase = createClient()

  useEffect(() => {
    if (!partnerId) return
    supabase.from('user_films')
      .select('*, film:films_cache(*)')
      .eq('user_id', partnerId)
      .eq('status', tab)
      .order('added_at', { ascending: false })
      .then(({ data }) => setItems(data ?? []))
  }, [tab, partnerId, supabase])

  if (loading) return <AppShell><div className="p-6 text-text-muted text-sm">Loading…</div></AppShell>
  if (!partnerId) return (
    <AppShell>
      <div className="p-6">
        <h1 className="text-lg font-bold mb-3">Her List</h1>
        <p className="text-text-muted text-sm">Not linked to a partner yet. Share your invite code from Profile.</p>
      </div>
    </AppShell>
  )

  return (
    <AppShell>
      <div className="p-6 max-w-screen-xl mx-auto">
        <h1 className="text-lg font-bold mb-5">Her List</h1>

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

        {items.length === 0 ? (
          <p className="text-text-muted text-sm">Nothing here yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {items.map((item: any) => (
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
                  <p className="text-xs text-text-muted mt-0.5">{item.film?.year}</p>
                </div>
                {item.status === 'watched' && item.score !== null && (
                  <span className="text-cinema-red font-bold text-sm">{item.score}</span>
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
