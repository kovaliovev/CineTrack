# Clickable Cast — Design Spec

**Date:** 2026-06-21

## Goal

Tapping an actor in the FilmDrawer cast strip opens their filmography inside the same drawer. The film detail stays in memory so Back is instant with no re-fetch.

---

## New API route

**`app/api/tmdb/person/[id]/route.ts`**

Calls TMDB:
```
GET /person/{id}?append_to_response=movie_credits&api_key=...
```

Returns a shaped response:
```ts
{
  id: number
  name: string
  profile_path: string | null
  birthday: string | null           // "YYYY-MM-DD" or null
  movie_credits: {
    cast: {
      id: number
      title: string
      poster_path: string | null
      release_date: string          // "YYYY-MM-DD"
      character: string
    }[]
  }
}
```

Before returning, filter `movie_credits.cast` to entries with a non-empty `release_date`, then sort descending by `release_date`. No crew credits returned.

---

## New type additions — `lib/types.ts`

```ts
export interface PersonCredit {
  id: number
  title: string
  poster_path: string | null
  release_date: string
  character: string
}

export interface PersonDetail {
  id: number
  name: string
  profile_path: string | null
  birthday: string | null
  movie_credits: { cast: PersonCredit[] }
}
```

---

## `FilmDrawer` changes — `components/films/FilmDrawer.tsx`

Add one state variable:
```ts
const [actorId, setActorId] = useState<number | null>(null)
```

Reset `actorId` to `null` inside the existing `useEffect([tmdbId])` reset block (so switching films clears any open actor view).

In the cast strip, make each actor card a `<button>` that calls `setActorId(member.id)`. Currently the card is a `<div>` — replace with `<button>` with `onClick={() => setActorId(member.id)}` and add `hover:opacity-80 transition-opacity cursor-pointer` to indicate interactivity.

When `actorId !== null`, render `<ActorPanel>` in place of the full drawer content:

```tsx
{actorId !== null ? (
  <ActorPanel
    personId={actorId}
    onBack={() => setActorId(null)}
    onOpenFilm={(id) => { setActorId(null); onOpenFilm?.(id) }}
    userId={userId}
  />
) : (
  /* existing drawer content */
)}
```

No other changes to FilmDrawer.

---

## New component — `components/films/ActorPanel.tsx`

Props:
```ts
interface Props {
  personId: number
  onBack: () => void
  onOpenFilm: (tmdbId: number) => void
  userId: string
}
```

### Internal state
```ts
const [person, setPerson] = useState<PersonDetail | null>(null)
const [statuses, setStatuses] = useState<Record<number, FilmCardStatus>>({})
```

### Data fetching
On mount (and on `personId` change), fetch in parallel:
1. `GET /api/tmdb/person/[personId]` → sets `person`
2. After person data arrives, batch-fetch `user_films` statuses for all film IDs in `person.movie_credits.cast`

### Render

**Header:**
```
← Back                          (button, calls onBack)

[Photo 56×56 rounded-full]  Name
                             Born YYYY  |  N films
```

Photo uses existing `profileUrl(person.profile_path)` helper. Fallback: initials in a circle. "Born YYYY" derived from `birthday?.slice(0,4)`. Film count = `person.movie_credits.cast.length`.

**Filmography strip:**
`HScroll` (reuse existing inline helper from FilmDrawer) containing film cards. Each card:

```
[poster 64×96 rounded-lg]
title (truncated, 11px)
year · character (truncated, 10px muted)
status dot (user's watched/wishlist/none — same StatusDot component)
```

Clicking a card calls `onOpenFilm(film.id)`.

Poster uses `posterUrl(film.poster_path)`. Year derived from `film.release_date.slice(0,4)`.

**Skeleton:** while loading, show a pulsing placeholder for the header (circle + two lines) and 6 poster skeletons in the strip.

### No partner status shown
The actor panel is space-constrained. Only the current user's status dot is shown (no partner dot). This keeps the card compact.

---

## Required extraction — `components/films/FilmDrawer.tsx`

`HScroll` and `StatusDot` are currently unexported inline components inside `FilmDrawer.tsx`. Since `ActorPanel` is a separate file, it cannot import them directly. Both must be extracted:

- `StatusDot` → `components/films/StatusDot.tsx` (named export)
- `HScroll` → `components/films/HScroll.tsx` (named export)

`FilmDrawer.tsx` then imports them from their new locations. No behavior change.

---

## What is NOT changing

- No changes to Supabase schema
- No changes to `FilmCard`, `FilmGrid`, `FilmRow`, `FilmPoster`
- No new pages
- The existing `onOpenFilm` prop on `FilmDrawer` is unchanged — `ActorPanel` calls it after clearing `actorId`
