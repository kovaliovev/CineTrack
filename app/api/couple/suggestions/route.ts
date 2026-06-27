import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchSuggestionsForGenre, posterUrl } from '@/lib/tmdb'

const GENRE_IDS: Record<string, number> = {
  'Action': 28, 'Adventure': 12, 'Animation': 16, 'Comedy': 35,
  'Crime': 80, 'Documentary': 99, 'Drama': 18, 'Family': 10751,
  'Fantasy': 14, 'History': 36, 'Horror': 27, 'Music': 10402,
  'Mystery': 9648, 'Romance': 10749, 'Science Fiction': 878,
  'Thriller': 53, 'War': 10752, 'Western': 37,
}

interface WatchedEntry {
  tmdb_id: number
  score: number | null
  film: { genres: string[] | null } | null
}

function buildGenreAffinity(films: WatchedEntry[]): Map<string, { total: number; count: number }> {
  const map = new Map<string, { total: number; count: number }>()
  films.forEach(f => {
    if (f.score === null) return
    ;(f.film?.genres ?? []).forEach(g => {
      const entry = map.get(g) ?? { total: 0, count: 0 }
      entry.total += f.score!
      entry.count++
      map.set(g, entry)
    })
  })
  return map
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const partnerId = req.nextUrl.searchParams.get('partnerId')
  if (!partnerId) return NextResponse.json({ error: 'partnerId required' }, { status: 400 })

  // Fetch both users' watched films with score + genres
  const [{ data: myRaw }, { data: partnerRaw }] = await Promise.all([
    supabase.from('user_films')
      .select('tmdb_id, score, film:films_cache(genres)')
      .eq('user_id', user.id)
      .eq('status', 'watched'),
    supabase.from('user_films')
      .select('tmdb_id, score, film:films_cache(genres)')
      .eq('user_id', partnerId)
      .eq('status', 'watched'),
  ])

  const myFilms = (myRaw ?? []) as unknown as WatchedEntry[]
  const partnerFilms = (partnerRaw ?? []) as unknown as WatchedEntry[]

  // Compute per-user genre affinity
  const myAffinity = buildGenreAffinity(myFilms)
  const partnerAffinity = buildGenreAffinity(partnerFilms)

  // Find shared genres where both users have ≥ 2 scored films
  const coupleGenres: { genre: string; score: number }[] = []
  myAffinity.forEach(({ total, count }, genre) => {
    if (count < 2) return
    const p = partnerAffinity.get(genre)
    if (!p || p.count < 2) return
    const myAvg = total / count
    const partnerAvg = p.total / p.count
    coupleGenres.push({ genre, score: (myAvg + partnerAvg) / 2 })
  })

  coupleGenres.sort((a, b) => b.score - a.score)
  const topGenres = coupleGenres.slice(0, 3)

  if (topGenres.length === 0) return NextResponse.json([])

  // Fetch all tmdb_ids for both users (watched + wishlist) to exclude
  const [{ data: myAll }, { data: partnerAll }] = await Promise.all([
    supabase.from('user_films').select('tmdb_id').eq('user_id', user.id),
    supabase.from('user_films').select('tmdb_id').eq('user_id', partnerId),
  ])

  const excludeIds = new Set<number>([
    ...(myAll ?? []).map((r: { tmdb_id: number }) => r.tmdb_id),
    ...(partnerAll ?? []).map((r: { tmdb_id: number }) => r.tmdb_id),
  ])

  // Fetch TMDB Discover for each top genre, filter, collect up to 8
  const seen = new Set<number>()
  const suggestions: {
    film: { tmdb_id: number; title: string; poster_url: string | null; year: number | null }
    reason: string
  }[] = []

  let genreResults: { genre: string; results: Awaited<ReturnType<typeof fetchSuggestionsForGenre>> }[]
  try {
    genreResults = await Promise.all(
      topGenres.map(async ({ genre }) => {
        const genreId = GENRE_IDS[genre]
        if (!genreId) return { genre, results: [] as Awaited<ReturnType<typeof fetchSuggestionsForGenre>> }
        const results = await fetchSuggestionsForGenre(genreId)
        return { genre, results }
      })
    )
  } catch {
    return NextResponse.json({ error: 'Failed to fetch suggestions' }, { status: 502 })
  }

  for (const { genre, results } of genreResults) {
    if (suggestions.length >= 8) break
    for (const movie of results) {
      if (suggestions.length >= 8) break
      if (excludeIds.has(movie.id) || seen.has(movie.id)) continue
      seen.add(movie.id)
      const year = movie.release_date ? parseInt(movie.release_date.slice(0, 4)) : null
      suggestions.push({
        film: { tmdb_id: movie.id, title: movie.title, poster_url: posterUrl(movie.poster_path), year },
        reason: `Because you both love ${genre}`,
      })
    }
  }

  return NextResponse.json(suggestions)
}
