# Couple Suggestions Feature — Design Spec
**Date:** 2026-06-27

## Overview

A "Suggested for You Two" section inside the existing "Watch Tonight?" tab on the Couple page. Surfaces unwatched films both partners are likely to enjoy, ranked by shared genre affinity (A) and topped by wishlist intersection (C, already built).

---

## Placement

Inside the `WishlistMatch` component ("Watch Tonight?" tab), below the existing wishlist-match grid. Separated by a section header. Suggestions load independently so wishlist matches appear instantly.

---

## Data Model & Computation

All computation happens server-side in a new API route.

**Genre affinity per user:**
- Fetch all `status = 'watched'` films for both users with `score` and `genres` (joined from `films_cache`)
- For each user, group scored films by genre and compute average score per genre
- Only include genres with ≥ 2 scored films (avoids noise from one-offs)

**Couple genre score:**
- Find genres where both users have affinity data
- Couple score = average of both users' genre averages
- Take top 3 genres by couple score

**TMDB Discover:**
- Call TMDB `/discover/movie?with_genres=<id>&sort_by=vote_average.desc&vote_count.gte=100` for each top genre (~10 results each)
- Genre name → TMDB ID mapping hardcoded in the API route (stable TMDB IDs)

**Filtering:**
- Exclude films already watched by either user
- Exclude films already on either user's wishlist (they appear in the wishlist-match section above)
- Deduplicate across genres (each film appears once; first genre match wins the reason label)
- Return up to 8 results

**Response shape:**
```ts
{ film: { tmdb_id, title, poster_url, year }, reason: string }[]
// reason example: "Because you both love Thriller"
```

---

## API Route

**`GET /api/couple/suggestions?partnerId=<uuid>`**

- Auth: current user from Supabase session (server-side)
- Supabase queries: same pattern as StatsView — two parallel `user_films` fetches joined to `films_cache`
- TMDB calls: via existing `get<T>()` helper in `lib/tmdb.ts`
- Returns: JSON array of `{ film, reason }`

---

## Components

### `components/couple/SuggestionsSection.tsx`
- `'use client'`, props: `{ partnerId: string }`
- Fetches from `/api/couple/suggestions?partnerId=...` on mount
- States: loading, empty, populated
- Renders: section header + film grid (2 cols mobile, 4 cols sm+), each card matching WishlistMatch card style
- Each card has a small reason chip below the title (e.g., `"Because you both love Thriller"`)
- Clicking a card opens `FilmDrawer`

### `components/couple/WishlistMatch.tsx` (modified)
- Imports and renders `<SuggestionsSection partnerId={partnerId} />` below the existing grid
- Section header: "Suggested for You Two" (consistent style: `text-xs font-semibold text-text-muted uppercase tracking-wider`)

---

## Edge Cases

| Situation | Behaviour |
|---|---|
| Neither user has ≥ 2 scored films in any genre | Show: "Rate some films you've watched to get suggestions" |
| No shared genre overlap | Same empty state |
| All Discover results already watched/wishlisted | Show fewer cards; if zero, show empty state |
| Partner has no watched films | Empty state |

---

## Out of Scope

- TMDB recommendations seeded from mutual favorites (can be added as "More suggestions" later)
- Sorting/filtering suggestions by the user
- Persisting or caching suggestions across sessions
