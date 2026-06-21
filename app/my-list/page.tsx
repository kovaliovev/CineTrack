'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import AppShell from '@/components/layout/AppShell'
import FilmDrawer from '@/components/films/FilmDrawer'
import { createClient } from '@/lib/supabase/client'
import type { UserFilm, Film } from '@/lib/types'
import { Dropdown, DropdownItem } from '@/components/ui/Dropdown'

type Tab = 'watched' | 'wishlist'
type Sort = 'date' | 'score' | 'title'

type ListItem = UserFilm & { film: Film | null }

const DECADES = [
  { label: '70s', value: 1970 },
  { label: '80s', value: 1980 },
  { label: '90s', value: 1990 },
  { label: '00s', value: 2000 },
  { label: '10s', value: 2010 },
  { label: '20s', value: 2020 },
]

const MIN_SCORE_OPTIONS = [
  { label: '6+', value: 6 },
  { label: '7+', value: 7 },
  { label: '8+', value: 8 },
  { label: '9+', value: 9 },
]

export default function MyListPage() {
  const [tab, setTab]           = useState<Tab>('watched')
  const [sort, setSort]         = useState<Sort>('date')
  const [allItems, setAllItems] = useState<ListItem[]>([])
  const [openFilmId, setOpenFilmId] = useState<number | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const supabase = createClient()

  const [searchInput, setSearchInput]     = useState('')
  const [searchQuery, setSearchQuery]     = useState('')
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null)
  const [selectedDecade, setSelectedDecade] = useState<number | null>(null)
  const [minScore, setMinScore]           = useState<number | null>(null)

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

  useEffect(() => {
    const t = setTimeout(() => setSearchQuery(searchInput), 300)
    return () => clearTimeout(t)
  }, [searchInput])

  async function remove(id: string) {
    await supabase.from('user_films').delete().eq('id', id)
    setAllItems(prev => prev.filter(i => i.id !== id))
  }

  function handleTabChange(newTab: Tab) {
    setTab(newTab)
    setSelectedGenre(null)
    setSelectedDecade(null)
    setMinScore(null)
    setSort('date')
  }

  const watched  = allItems.filter(i => i.status === 'watched')
  const wishlist = allItems.filter(i => i.status === 'wishlist')
  const items    = tab === 'watched' ? watched : wishlist

  const availableGenres = [...new Set(items.flatMap(i => i.film?.genres ?? []))].sort()

  const sorted = [...items].sort((a, b) => {
    if (sort === 'score') return (b.score ?? 0) - (a.score ?? 0)
    if (sort === 'title') return (a.film?.title ?? '').localeCompare(b.film?.title ?? '')
    return new Date(b.added_at).getTime() - new Date(a.added_at).getTime()
  })

  const displayed = sorted.filter(item => {
    if (searchQuery && !item.film?.title?.toLowerCase().includes(searchQuery.toLowerCase())) return false
    if (selectedGenre && !item.film?.genres?.includes(selectedGenre)) return false
    if (selectedDecade && item.film?.year) {
      if (Math.floor(item.film.year / 10) * 10 !== selectedDecade) return false
    }
    if (minScore !== null && (item.score ?? 0) < minScore) return false
    return true
  })

  const currentDecade  = DECADES.find(d => d.value === selectedDecade)
  const currentMinScore = MIN_SCORE_OPTIONS.find(o => o.value === minScore)
  const hasActiveFilters = selectedGenre !== null || selectedDecade !== null || minScore !== null

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
              onClick={() => handleTabChange(t.key)}
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

        {/* Search */}
        <div className="relative max-w-sm mb-4">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M9.5 9.5L13 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Search your list…"
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

        {/* Filter toolbar */}
        <div className="flex flex-col gap-2 mb-5">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Sort */}
            <Dropdown
              label={sort === 'date' ? 'Date added' : sort === 'score' ? 'Score' : 'Title'}
              active={false}
            >
              <DropdownItem label="Date added" active={sort === 'date'} onClick={() => setSort('date')} />
              {tab === 'watched' && (
                <DropdownItem label="Score" active={sort === 'score'} onClick={() => setSort('score')} />
              )}
              <DropdownItem label="Title" active={sort === 'title'} onClick={() => setSort('title')} />
            </Dropdown>

            {/* Genre */}
            <Dropdown label={selectedGenre ?? 'Genre'} active={selectedGenre !== null}>
              <DropdownItem label="All genres" active={selectedGenre === null} onClick={() => setSelectedGenre(null)} />
              {availableGenres.length > 0 && <div className="border-t border-bg-border my-1" />}
              <div className="max-h-64 overflow-y-auto">
                {availableGenres.map(g => (
                  <DropdownItem key={g} label={g} active={selectedGenre === g} onClick={() => setSelectedGenre(g)} />
                ))}
              </div>
            </Dropdown>

            {/* Decade */}
            <Dropdown label={currentDecade ? currentDecade.label : 'Decade'} active={selectedDecade !== null}>
              <DropdownItem label="All decades" active={selectedDecade === null} onClick={() => setSelectedDecade(null)} />
              <div className="border-t border-bg-border my-1" />
              {DECADES.map(d => (
                <DropdownItem key={d.value} label={d.label} active={selectedDecade === d.value} onClick={() => setSelectedDecade(d.value)} />
              ))}
            </Dropdown>

            {/* Min score — watched tab only */}
            {tab === 'watched' && (
              <Dropdown label={currentMinScore ? currentMinScore.label : 'Min score'} active={minScore !== null}>
                <DropdownItem label="Any score" active={minScore === null} onClick={() => setMinScore(null)} />
                <div className="border-t border-bg-border my-1" />
                {MIN_SCORE_OPTIONS.map(o => (
                  <DropdownItem key={o.value} label={o.label} active={minScore === o.value} onClick={() => setMinScore(o.value)} />
                ))}
              </Dropdown>
            )}
          </div>

          {/* Active filter chips + count */}
          {(hasActiveFilters || searchQuery) && (
            <div className="flex items-center gap-2 flex-wrap">
              {hasActiveFilters && <span className="text-xs text-text-muted">Filtered by:</span>}
              {selectedGenre && (
                <button
                  onClick={() => setSelectedGenre(null)}
                  className="flex items-center gap-1 px-2 py-0.5 bg-cinema-red/10 border border-cinema-red-border text-cinema-red text-xs rounded-full hover:bg-cinema-red/20 transition-colors"
                >
                  {selectedGenre}
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden="true">
                    <path d="M1 1L7 7M7 1L1 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
              )}
              {currentDecade && (
                <button
                  onClick={() => setSelectedDecade(null)}
                  className="flex items-center gap-1 px-2 py-0.5 bg-cinema-red/10 border border-cinema-red-border text-cinema-red text-xs rounded-full hover:bg-cinema-red/20 transition-colors"
                >
                  {currentDecade.label}
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden="true">
                    <path d="M1 1L7 7M7 1L1 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
              )}
              {currentMinScore && (
                <button
                  onClick={() => setMinScore(null)}
                  className="flex items-center gap-1 px-2 py-0.5 bg-cinema-red/10 border border-cinema-red-border text-cinema-red text-xs rounded-full hover:bg-cinema-red/20 transition-colors"
                >
                  {currentMinScore.label}
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden="true">
                    <path d="M1 1L7 7M7 1L1 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
              )}
              <span className="text-xs text-text-muted ml-auto">{displayed.length} film{displayed.length !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>

        {/* List */}
        {displayed.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-text-muted text-sm mb-3">
              {searchQuery || hasActiveFilters
                ? 'No films match your filters.'
                : tab === 'watched' ? 'No watched films yet.' : 'Your wishlist is empty.'}
            </p>
            {!searchQuery && !hasActiveFilters && (
              <Link href="/discover" className="text-xs text-cinema-red hover:underline">
                Browse Discover →
              </Link>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {displayed.map(item => (
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
      }} onOpenFilm={setOpenFilmId} />}
    </AppShell>
  )
}
