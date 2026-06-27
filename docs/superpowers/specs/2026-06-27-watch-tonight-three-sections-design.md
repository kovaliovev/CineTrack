# Watch Tonight — Three Sections Design Spec
**Date:** 2026-06-27

## Overview

Restructure the "Watch Tonight?" tab on the Couple page into three clearly named, independently loading sections. Add a new "In the Same Vein" section seeded from mutual favorites via TMDB recommendations. Rename the host component from `WishlistMatch` to `WatchTonight`.

---

## Three Sections

### Section 1 — "On Both Your Lists"
Films both partners have on their wishlist. Highest-intent signal — shown first. Logic unchanged from existing wishlist intersection code.

### Section 2 — "Tailored for You Two"
Films picked based on genres both partners consistently score highly. Genre affinity algorithm unchanged. Each card shows a reason chip: *"Because you both love Thriller"*.

### Section 3 — "In the Same Vein"
Films similar to ones both partners rated ≥7. Seeded from mutual high-scored films via TMDB `/movie/{id}/recommendations`. Each card shows a reason chip: *"Because you both loved [Film Title]"*.

---

## Architecture

### New API route: `GET /api/couple/similar?partnerId=<uuid>`

1. Auth + partner verification (same couple-membership guard as `/api/couple/suggestions`)
2. Fetch both users' watched films with scores from `user_films` + `films_cache`
3. Find films where **both** users scored ≥7 — these are the seeds
4. Take up to 5 seeds (highest combined score first)
5. Fetch TMDB `/movie/{id}/recommendations` for all seeds in parallel via `Promise.allSettled`
6. Flatten + deduplicate results; filter out films either user has watched or wishlisted
7. Return up to 8 `{ film: { tmdb_id, title, poster_url, year }, reason: string }[]`
   - `reason` = `"Because you both loved [seed film title]"`

Edge cases:
- Fewer than 2 mutual ≥7 films → return `[]` (empty state: "Rate some films together to get suggestions here")
- All TMDB results already watched/wishlisted → return fewer cards or `[]`
- `Promise.allSettled` — partial TMDB failures surface whatever results succeeded

### New component: `components/couple/SimilarSection.tsx`
- `'use client'`, props: `{ partnerId: string }`
- Identical pattern to `SuggestionsSection`: fetch on mount with cancellation, loading/error/empty/populated states
- Error state: "Couldn't load suggestions right now."
- Empty state: "Rate films you've both watched to get suggestions here."
- Grid: `grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3`
- Each card: poster, title, year, reason chip (`text-cinema-red`)
- Clicking a card opens `FilmDrawer`

### Rename: `WishlistMatch.tsx` → `WatchTonight.tsx`

The component now hosts all three sections. Rename to reflect its true responsibility.

Changes:
- File renamed to `components/couple/WatchTonight.tsx`; export renamed to `WatchTonight`
- Import in `app/couple/page.tsx` updated
- Section headers updated to final names: "On Both Your Lists", "Tailored for You Two", "In the Same Vein"
- `SuggestionsSection` header moves inside `WatchTonight` (currently it's there but labelled "Suggested for You Two" — rename to "Tailored for You Two")
- New `<SimilarSection partnerId={partnerId} />` added below with header "In the Same Vein"
- Each section separated by consistent header style: `text-xs font-semibold text-text-muted uppercase tracking-wider mb-3`
- Sections stack vertically with `mt-8` between them

### New TMDB helper: `fetchRecommendations` already exists in `lib/tmdb.ts`

`fetchRecommendations(id: number)` is already exported — returns up to 12 results. Use it directly in the new API route; no new helper needed.

---

## Section Layout (top to bottom)

```
[ On Both Your Lists ]
  <grid or empty state>

[ Tailored for You Two ]
  <grid or empty state>

[ In the Same Vein ]
  <grid or empty state>
```

All three sections always render (no section hides another). Each has its own loading state.

---

## Out of Scope

- Sorting or filtering within sections
- Persisting suggestions across sessions
- Combining sections into a single API call
