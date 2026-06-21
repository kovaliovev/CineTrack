# My List — Search & Filter

**Date:** 2026-06-21

## Goal

Add search and filtering to the My List page so users can quickly find films in a growing watched or wishlist collection. All filtering is client-side (no new DB queries) because the full list is already loaded into memory.

---

## Refactor: Extract Dropdown primitives

`Dropdown` and `DropdownItem` are currently private inside `components/ui/FilterBar.tsx`. Extract them to `components/ui/Dropdown.tsx` and import them in `FilterBar.tsx` (no behavior change). My List will import them too.

---

## Components changed

### `components/ui/Dropdown.tsx` (new)

Exports:
- `Dropdown` — pill button that opens a floating panel. Props: `label`, `active` (bool, drives red tint), `children`.
- `DropdownItem` — row inside the panel. Props: `label`, `active`, `onClick`.

Identical to the existing internals in `FilterBar.tsx`.

### `components/ui/FilterBar.tsx` (updated)

Import `Dropdown`/`DropdownItem` from `./Dropdown` instead of defining them inline. No other changes.

### `app/my-list/page.tsx` (updated)

#### New state

| State | Type | Purpose |
|---|---|---|
| `searchInput` | `string` | Raw input value |
| `searchQuery` | `string` | Debounced (300ms) search term |
| `selectedGenre` | `string \| null` | Genre string (e.g. `"Action"`) |
| `selectedDecade` | `number \| null` | Decade start year (e.g. `1990`) |
| `minScore` | `number \| null` | Min score threshold (6, 7, 8, or 9) |

#### Search input

Same pattern as Explore: `max-w-sm`, magnifying glass icon left, `×` clear button right, `focus:border-cinema-red`. Placed above the filter toolbar.

#### Filter toolbar

Replaces the current flat "Sort:" button row. Uses the shared `Dropdown`/`DropdownItem` components.

| Dropdown | Options | Visibility |
|---|---|---|
| Sort | Date added / Score / Title | Always |
| Genre | Derived from genres in current tab's items | Always |
| Decade | 70s / 80s / 90s / 00s / 10s / 20s | Always |
| Min Score | Any / 6+ / 7+ / 8+ / 9+ | Watched tab only |

Genre list is built at render time from `allItems` filtered to the active tab:
```ts
const availableGenres = [...new Set(
  items.flatMap(i => i.film?.genres ?? [])
)].sort()
```

Genres are stored as string arrays in `films_cache`, so matching is `film.genres.includes(selectedGenre)`.

Decade matching: `Math.floor((film.year ?? 0) / 10) * 10 === selectedDecade`.

#### Active filter chips

Shown below the toolbar when any filter is active, identical to the Explore pattern:
```
Filtered by:  Action ×   90s ×   8+ ×
```

Clicking a chip clears that filter.

#### Filtered count

One line of muted text below the chips (or below toolbar if no chips): `"12 films"`. Updates live.

#### Filtering logic

Applied after sorting, purely in memory:

```ts
const displayed = sorted.filter(item => {
  if (searchQuery && !item.film?.title?.toLowerCase().includes(searchQuery.toLowerCase())) return false
  if (selectedGenre && !item.film?.genres?.includes(selectedGenre)) return false
  if (selectedDecade && item.film?.year) {
    if (Math.floor(item.film.year / 10) * 10 !== selectedDecade) return false
  }
  if (minScore !== null && (item.score ?? 0) < minScore) return false
  return true
})
```

#### Filter reset on tab change

When the user switches tabs (Watched ↔ Wishlist), reset `selectedGenre`, `selectedDecade`, and `minScore` to null. The genre list is tab-specific so stale selections would show zero results.

---

## What is NOT changing

- No new API routes or DB queries
- No changes to Supabase schema
- No changes to `FilmDrawer`, `FilmCard`, `FilmGrid`, or `FilmRow`
- The partner-list page is out of scope
