# My List — Search & Filter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add debounced title search, genre/decade/min-score dropdowns, active-filter chips, and a filtered count to the My List page, matching the Explore page visual style.

**Architecture:** Extract shared `Dropdown`/`DropdownItem` primitives from `FilterBar.tsx` into a new file, then add all filter state and UI to `my-list/page.tsx`. All filtering is client-side on the already-loaded `allItems` array — no new API routes or DB queries.

**Tech Stack:** Next.js 15 App Router, React, Tailwind CSS, Supabase client (existing).

## Global Constraints

- Match the visual style of `components/ui/FilterBar.tsx` and `app/explore/page.tsx` exactly (pill dropdowns, red active tint, removable chips).
- No new API routes, no Supabase schema changes.
- All filtering runs in memory on the `allItems` array already loaded by the page.
- Genres in `films_cache` are stored as `string[]`, not `{ id, name }` objects — match by string.
- TypeScript strict mode — no `any`.

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| **Create** | `components/ui/Dropdown.tsx` | Shared `Dropdown` + `DropdownItem` primitives |
| **Modify** | `components/ui/FilterBar.tsx` | Import from `./Dropdown` instead of defining inline |
| **Modify** | `app/my-list/page.tsx` | Search input, filter toolbar, chips, count, filtered render |

---

### Task 1: Extract Dropdown primitives

**Files:**
- Create: `components/ui/Dropdown.tsx`
- Modify: `components/ui/FilterBar.tsx`

**Interfaces:**
- Produces: `Dropdown` (props: `label: string`, `active: boolean`, `children: React.ReactNode`) and `DropdownItem` (props: `label: string`, `active: boolean`, `onClick: () => void`) — both named exports from `components/ui/Dropdown.tsx`.

- [ ] **Step 1: Create `components/ui/Dropdown.tsx`**

```tsx
'use client'
import { useState, useRef, useEffect } from 'react'

export function Dropdown({
  label,
  active,
  children,
}: {
  label: string
  active: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors border ${
          active
            ? 'bg-cinema-red/10 border-cinema-red-border text-cinema-red'
            : 'bg-bg-elevated border-bg-border text-text-secondary hover:text-white hover:border-cinema-red'
        }`}
      >
        {label}
        <svg
          width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true"
          className={`transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
        >
          <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1.5 bg-bg-card border border-bg-border rounded-xl shadow-xl z-50 py-1 min-w-[160px]">
          {children}
        </div>
      )}
    </div>
  )
}

export function DropdownItem({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-2 text-sm transition-colors ${
        active ? 'text-cinema-red font-medium' : 'text-text-secondary hover:text-white hover:bg-bg-elevated'
      }`}
    >
      {label}
    </button>
  )
}
```

- [ ] **Step 2: Update `components/ui/FilterBar.tsx` to import from `./Dropdown`**

Replace the existing `Dropdown` and `DropdownItem` function definitions (lines 32–89) and add the import at the top. The rest of the file is unchanged.

Add this import after the existing imports at the top:
```tsx
import { Dropdown, DropdownItem } from './Dropdown'
```

Delete lines 32–89 (the `Dropdown` and `DropdownItem` function bodies). The rest of the file — `SORT_OPTIONS`, `DECADES`, and the `FilterBar` default export — stays identical.

- [ ] **Step 3: Verify Explore page still works**

Run the dev server (`npm run dev` from the `cinetrack` directory) and open `/explore`. Confirm:
- Genre, Decade, Sort dropdowns still open and close
- Selecting a filter still highlights the pill in red
- Active chips still appear below the toolbar
- No console errors

- [ ] **Step 4: Commit**

```bash
git add components/ui/Dropdown.tsx components/ui/FilterBar.tsx
git commit -m "refactor: extract Dropdown primitives from FilterBar into shared component"
```

---

### Task 2: Add search, filters, chips and count to My List

**Files:**
- Modify: `app/my-list/page.tsx`

**Interfaces:**
- Consumes: `Dropdown`, `DropdownItem` from `components/ui/Dropdown.tsx`

- [ ] **Step 1: Add imports and constants at the top of `app/my-list/page.tsx`**

Add the import after the existing imports:
```tsx
import { Dropdown, DropdownItem } from '@/components/ui/Dropdown'
```

Add these constants directly above the `MyListPage` function:
```tsx
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
```

- [ ] **Step 2: Add filter state variables inside `MyListPage`**

Add these after the existing `useState` declarations (after `const supabase = createClient()`):
```tsx
const [searchInput, setSearchInput]     = useState('')
const [searchQuery, setSearchQuery]     = useState('')
const [selectedGenre, setSelectedGenre] = useState<string | null>(null)
const [selectedDecade, setSelectedDecade] = useState<number | null>(null)
const [minScore, setMinScore]           = useState<number | null>(null)
```

- [ ] **Step 3: Add debounce effect for search**

Add after the existing `useEffect` that calls `loadItems`:
```tsx
useEffect(() => {
  const t = setTimeout(() => setSearchQuery(searchInput), 300)
  return () => clearTimeout(t)
}, [searchInput])
```

- [ ] **Step 4: Replace the `setTab` calls with a reset handler**

Add this function after the `remove` function:
```tsx
function handleTabChange(newTab: Tab) {
  setTab(newTab)
  setSelectedGenre(null)
  setSelectedDecade(null)
  setMinScore(null)
}
```

In the JSX, find the two `onClick={() => setTab(t.key)}` calls in the tabs section and replace each with `onClick={() => handleTabChange(t.key)}`.

- [ ] **Step 5: Add derived values — `availableGenres` and `displayed`**

Replace the existing `const sorted = ...` block with:
```tsx
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
```

- [ ] **Step 6: Replace the sort UI and add search + filter toolbar in JSX**

Find this block in the JSX and replace it entirely:
```tsx
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
```

Replace with:
```tsx
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
```

- [ ] **Step 7: Replace `sorted` with `displayed` in the render**

Find the empty-state check and list render. Replace every reference to `sorted` with `displayed`:

```tsx
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
      // ... existing item JSX unchanged ...
    ))}
  </div>
)}
```

- [ ] **Step 8: Verify in browser**

Run `npm run dev` and open `/my-list`. Check:
1. Search input filters the list as you type (300ms debounce) — clear button appears
2. Genre dropdown shows only genres present in the current tab's items; selecting one filters the list; chip appears
3. Decade dropdown filters by decade; chip appears
4. Min Score dropdown only appears on the Watched tab; selecting 8+ shows only 8s, 9s, 10s
5. Switching tabs (Watched ↔ Wishlist) resets all filter chips
6. Film count updates live: "4 films"
7. Empty state with filters active shows "No films match your filters." with no "Browse Discover" link
8. Open Explore page — FilterBar dropdowns still work (no regression)
9. No TypeScript errors in terminal

- [ ] **Step 9: Commit**

```bash
git add app/my-list/page.tsx
git commit -m "feat: add search, genre/decade/score filters to My List"
```
