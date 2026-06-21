# Clickable Cast Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tapping an actor in the FilmDrawer cast strip opens their filmography inside the same drawer with a Back button to return to the film.

**Architecture:** Extract `HScroll` and `StatusDot` from `FilmDrawer.tsx` into shared components, add a `/api/tmdb/person/[id]` route, build a self-contained `ActorPanel` component, then wire `actorId` state into `FilmDrawer` to conditionally render it.

**Tech Stack:** Next.js 15 App Router, React, Tailwind CSS, Supabase client, TMDB API (existing `get` helper in `lib/tmdb.ts`).

## Global Constraints

- Next.js 15 dynamic route params are async: `{ params }: { params: Promise<{ id: string }> }`, then `const { id } = await params` — copy this pattern verbatim from existing routes.
- All TMDB fetches go through the `get` helper in `lib/tmdb.ts`, not raw `fetch`.
- TypeScript strict — no `any`.
- No new Supabase schema changes.
- Only the current user's status dot shown in the actor filmography (no partner dot).
- `HScroll` and `StatusDot` have no React hooks — no `'use client'` directive needed.
- `ActorPanel` is a default export; `HScroll` and `StatusDot` are named exports.

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| **Create** | `components/films/HScroll.tsx` | Right-fade horizontal scroll wrapper |
| **Create** | `components/films/StatusDot.tsx` | Watched/wishlist/none status indicator dot |
| **Modify** | `lib/types.ts` | Add `PersonCredit`, `PersonDetail` interfaces |
| **Modify** | `lib/tmdb.ts` | Add `fetchPersonDetail` function |
| **Create** | `app/api/tmdb/person/[id]/route.ts` | Fetch + shape TMDB person + movie_credits |
| **Create** | `components/films/ActorPanel.tsx` | Actor header + filmography strip |
| **Modify** | `components/films/FilmDrawer.tsx` | Import extracted components, add `actorId` state, wire cast clicks, conditional render |

---

### Task 1: Extract shared components + add types

**Files:**
- Create: `components/films/HScroll.tsx`
- Create: `components/films/StatusDot.tsx`
- Modify: `lib/types.ts`
- Modify: `components/films/FilmDrawer.tsx`

**Interfaces:**
- Produces:
  - `HScroll({ children: React.ReactNode })` — named export from `components/films/HScroll.tsx`
  - `StatusDot({ filmStatus: FilmCardStatus['status'], label: string })` — named export from `components/films/StatusDot.tsx`
  - `PersonCredit`, `PersonDetail` — named exports from `lib/types.ts`

- [ ] **Step 1: Create `components/films/HScroll.tsx`**

```tsx
export function HScroll({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      <div className="absolute right-0 top-0 bottom-2 w-10 bg-gradient-to-l from-bg-card to-transparent z-10 pointer-events-none" />
      <div
        className="flex gap-2.5 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: 'none' }}
      >
        {children}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create `components/films/StatusDot.tsx`**

```tsx
import type { FilmCardStatus } from '@/lib/types'

export function StatusDot({ filmStatus, label }: { filmStatus: FilmCardStatus['status']; label: string }) {
  if (filmStatus === 'watched')
    return <span className="text-[11px] leading-none text-emerald-400" title={`${label}: Watched`}>●</span>
  if (filmStatus === 'wishlist')
    return <span className="text-[11px] leading-none text-cinema-red" title={`${label}: Wishlisted`}>●</span>
  return <span className="text-[11px] leading-none text-text-muted" title={`${label}: Not seen`}>○</span>
}
```

- [ ] **Step 3: Add `PersonCredit` and `PersonDetail` to `lib/types.ts`**

Append to the end of `lib/types.ts`:

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

- [ ] **Step 4: Update `components/films/FilmDrawer.tsx` imports — replace inline definitions**

At the top of `FilmDrawer.tsx`, add these imports alongside the existing ones:

```tsx
import { HScroll } from './HScroll'
import { StatusDot } from './StatusDot'
```

Then delete the two inline function definitions currently in the file:

Delete the `HScroll` arrow function (the `const HScroll = ...` block, approximately lines 46–56).

Delete the `StatusDot` function (the `function StatusDot` block, approximately lines 38–44).

The rest of the file is unchanged — all existing usages of `HScroll` and `StatusDot` inside the JSX continue to work via the new imports.

- [ ] **Step 5: Verify TypeScript**

```bash
cd C:\Users\staff01\Desktop\Web\CineTrack\cinetrack
npx tsc --noEmit
```

Expected: no output (zero errors).

- [ ] **Step 6: Commit**

```bash
git add components/films/HScroll.tsx components/films/StatusDot.tsx lib/types.ts components/films/FilmDrawer.tsx
git commit -m "refactor: extract HScroll and StatusDot; add PersonCredit and PersonDetail types"
```

---

### Task 2: Person API route

**Files:**
- Modify: `lib/tmdb.ts`
- Create: `app/api/tmdb/person/[id]/route.ts`

**Interfaces:**
- Consumes: `get` helper (already in `lib/tmdb.ts`), `PersonDetail` from `lib/types.ts`
- Produces: `GET /api/tmdb/person/[id]` returns `PersonDetail` JSON — cast filtered to entries with `release_date`, sorted descending by `release_date`

- [ ] **Step 1: Add `fetchPersonDetail` to `lib/tmdb.ts`**

Add this interface and function at the end of `lib/tmdb.ts`, before the final export statements (or after the last export — order does not matter):

```ts
interface TMDBPersonRaw {
  id: number
  name: string
  profile_path: string | null
  birthday: string | null
  movie_credits?: {
    cast: Array<{
      id: number
      title: string
      poster_path: string | null
      release_date: string
      character: string
    }>
  }
}

export async function fetchPersonDetail(id: number): Promise<TMDBPersonRaw> {
  return get<TMDBPersonRaw>(`/person/${id}`, { append_to_response: 'movie_credits' })
}
```

- [ ] **Step 2: Create `app/api/tmdb/person/[id]/route.ts`**

First create the directory: `app/api/tmdb/person/[id]/`

Then create the file:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { fetchPersonDetail } from '@/lib/tmdb'
import type { PersonDetail } from '@/lib/types'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const data = await fetchPersonDetail(Number(id))
    const cast = (data.movie_credits?.cast ?? [])
      .filter(c => c.release_date)
      .sort((a, b) => b.release_date.localeCompare(a.release_date))
      .map(c => ({
        id: c.id,
        title: c.title,
        poster_path: c.poster_path,
        release_date: c.release_date,
        character: c.character,
      }))
    const result: PersonDetail = {
      id: data.id,
      name: data.name,
      profile_path: data.profile_path ?? null,
      birthday: data.birthday ?? null,
      movie_credits: { cast },
    }
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no output (zero errors).

- [ ] **Step 4: Commit**

```bash
git add lib/tmdb.ts app/api/tmdb/person
git commit -m "feat: add person filmography API route"
```

---

### Task 3: ActorPanel component + FilmDrawer wiring

**Files:**
- Create: `components/films/ActorPanel.tsx`
- Modify: `components/films/FilmDrawer.tsx`

**Interfaces:**
- Consumes:
  - `HScroll` from `./HScroll`
  - `StatusDot` from `./StatusDot`
  - `PersonDetail`, `FilmCardStatus` from `@/lib/types`
  - `posterUrl`, `profileUrl` from `@/lib/tmdb`
  - `createClient` from `@/lib/supabase/client`
  - `GET /api/tmdb/person/[id]` returns `PersonDetail`
- Produces: `ActorPanel` default export with props `{ personId: number, onBack: () => void, onOpenFilm: (tmdbId: number) => void, userId: string }`

- [ ] **Step 1: Create `components/films/ActorPanel.tsx`**

```tsx
'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { posterUrl, profileUrl } from '@/lib/tmdb'
import { HScroll } from './HScroll'
import { StatusDot } from './StatusDot'
import type { PersonDetail, FilmCardStatus } from '@/lib/types'

interface Props {
  personId: number
  onBack: () => void
  onOpenFilm: (tmdbId: number) => void
  userId: string
}

export default function ActorPanel({ personId, onBack, onOpenFilm, userId }: Props) {
  const [person, setPerson] = useState<PersonDetail | null>(null)
  const [statuses, setStatuses] = useState<Record<number, FilmCardStatus>>({})

  useEffect(() => {
    setPerson(null)
    setStatuses({})
    let cancelled = false

    fetch(`/api/tmdb/person/${personId}`)
      .then(r => r.json())
      .then((data: PersonDetail) => {
        if (cancelled) return
        setPerson(data)
        if (!userId || !data.movie_credits.cast.length) return
        const ids = data.movie_credits.cast.map(f => f.id)
        createClient()
          .from('user_films')
          .select('tmdb_id, status, score')
          .eq('user_id', userId)
          .in('tmdb_id', ids)
          .then(({ data: ufData }) => {
            if (cancelled || !ufData) return
            const map: Record<number, FilmCardStatus> = {}
            ufData.forEach(uf => { map[uf.tmdb_id] = { status: uf.status, score: uf.score } })
            setStatuses(map)
          })
      })

    return () => { cancelled = true }
  }, [personId, userId])

  const photo      = person ? profileUrl(person.profile_path) : null
  const initials   = person ? person.name.split(' ').map(n => n[0]).slice(0, 2).join('') : ''
  const birthYear  = person?.birthday?.slice(0, 4)
  const filmCount  = person?.movie_credits.cast.length ?? 0

  return (
    <div className="p-4 sm:p-6 pb-8">
      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-text-muted hover:text-white transition-colors mb-5"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Back
      </button>

      {!person ? (
        <div className="animate-pulse">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-14 h-14 rounded-full bg-bg-elevated flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-bg-elevated rounded w-1/2" />
              <div className="h-3 bg-bg-elevated rounded w-1/3" />
            </div>
          </div>
          <div className="flex gap-2.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex-none w-16">
                <div className="aspect-[2/3] rounded-lg bg-bg-elevated" />
                <div className="h-2 bg-bg-elevated rounded mt-2 w-3/4" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="flex items-center gap-3 mb-5">
            <div className="relative w-14 h-14 rounded-full overflow-hidden bg-bg-elevated flex-shrink-0">
              {photo
                ? <Image src={photo} alt={person.name} fill className="object-cover object-top" sizes="56px" />
                : <div className="w-full h-full flex items-center justify-center text-text-muted text-sm font-semibold">{initials}</div>
              }
            </div>
            <div>
              <h3 className="text-base font-bold text-text-primary leading-tight">{person.name}</h3>
              <p className="text-xs text-text-muted mt-0.5">
                {birthYear && <span>Born {birthYear}</span>}
                {birthYear && filmCount > 0 && <span className="mx-1">·</span>}
                {filmCount > 0 && <span>{filmCount} film{filmCount !== 1 ? 's' : ''}</span>}
              </p>
            </div>
          </div>

          {/* Filmography */}
          {person.movie_credits.cast.length > 0 && (
            <HScroll>
              {person.movie_credits.cast.map(film => {
                const poster      = posterUrl(film.poster_path)
                const year        = film.release_date?.slice(0, 4)
                const filmStatus  = statuses[film.id] ?? { status: null, score: null }
                return (
                  <button
                    key={film.id}
                    onClick={() => onOpenFilm(film.id)}
                    className="flex-none w-16 sm:w-[72px] text-center group"
                    title={film.title}
                  >
                    <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-bg-elevated border border-transparent group-hover:border-cinema-red/40 transition-colors">
                      {poster
                        ? <Image src={poster} alt={film.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="72px" />
                        : <div className="w-full h-full flex items-center justify-center text-text-muted text-[9px] p-1 text-center leading-tight">{film.title}</div>
                      }
                    </div>
                    <p className="text-[10px] font-medium text-text-primary truncate mt-1.5 leading-tight">{film.title}</p>
                    <p className="text-[10px] text-text-muted truncate leading-tight">
                      {year}{film.character ? ` · ${film.character}` : ''}
                    </p>
                    <div className="flex justify-center mt-1">
                      <StatusDot filmStatus={filmStatus.status} label="You" />
                    </div>
                  </button>
                )
              })}
            </HScroll>
          )}
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Add `actorId` state and import to `FilmDrawer.tsx`**

Add this import at the top alongside existing film component imports:
```tsx
import ActorPanel from './ActorPanel'
```

Add this state variable alongside the existing `useState` declarations inside the component:
```tsx
const [actorId, setActorId] = useState<number | null>(null)
```

Add `setActorId(null)` to the existing `useEffect([tmdbId])` reset block. The block currently starts with `setDetail(null)` — add the reset as the last item in that block:
```tsx
setActorId(null)
```

- [ ] **Step 3: Make cast member cards clickable in `FilmDrawer.tsx`**

In the cast strip section, find the wrapping element for each cast member. It is currently:
```tsx
<div key={member.id} className="flex-none w-14 sm:w-16 text-center">
```

Replace the opening tag and its matching closing `</div>` with a `<button>`:
```tsx
<button
  key={member.id}
  onClick={() => setActorId(member.id)}
  className="flex-none w-14 sm:w-16 text-center hover:opacity-80 transition-opacity"
>
```
and close with `</button>`. The contents (photo div, name paragraph, character paragraph) are unchanged.

- [ ] **Step 4: Add conditional render for `ActorPanel` in `FilmDrawer.tsx`**

The drawer currently renders:
```tsx
{/* Close button */}
<button onClick={onClose} ...>...</button>

{!detail ? (
  /* skeleton */
) : (
  /* full content */
)}
```

Wrap the skeleton/content conditional so `ActorPanel` takes priority when `actorId` is set:
```tsx
{/* Close button */}
<button onClick={onClose} ...>...</button>

{actorId !== null ? (
  <ActorPanel
    personId={actorId}
    onBack={() => setActorId(null)}
    onOpenFilm={(id) => { setActorId(null); onOpenFilm?.(id) }}
    userId={userId}
  />
) : !detail ? (
  /* existing skeleton — unchanged */
) : (
  /* existing full content — unchanged */
)}
```

- [ ] **Step 5: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no output (zero errors).

- [ ] **Step 6: Verify in browser**

Run `npm run dev` and open any film in the drawer. Check:
1. Cast strip shows actor photos/names as before
2. Hovering an actor card dims it slightly (opacity-80)
3. Clicking an actor card shows the actor panel: Back button, actor photo + name + born year + film count, horizontal filmography strip
4. Skeleton loads while data fetches (circle + lines + poster placeholders)
5. Films in the filmography strip show poster, title, year · character, and a status dot
6. Clicking a film in the filmography opens that film in the drawer (Back disappears, film content shows)
7. Clicking Back from the actor panel returns to the film content instantly (no loading)
8. Opening a different film while actor panel is shown resets to the film view (no actor panel on new film)
9. No console errors

- [ ] **Step 7: Commit**

```bash
git add components/films/ActorPanel.tsx components/films/FilmDrawer.tsx
git commit -m "feat: clickable cast opens actor filmography in drawer"
```
