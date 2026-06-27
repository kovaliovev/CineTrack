import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { fetchRecommendations, posterUrl } from '@/lib/tmdb'

interface WatchedEntry {
  tmdb_id: number
  score: number | null
  film: { title: string } | null
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const partnerId = req.nextUrl.searchParams.get('partnerId')
  if (!partnerId) return NextResponse.json({ error: 'partnerId required' }, { status: 400 })

  // Verify couple relationship
  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('couple_id')
    .eq('id', user.id)
    .single()

  if (!profile?.couple_id) {
    return NextResponse.json({ error: 'Not in a couple' }, { status: 403 })
  }

  const { data: couple } = await admin
    .from('couples')
    .select('user1_id, user2_id')
    .eq('id', profile.couple_id)
    .single()

  const isValidPartner = couple?.user1_id === partnerId || couple?.user2_id === partnerId
  if (!isValidPartner) {
    return NextResponse.json({ error: 'Invalid partner' }, { status: 403 })
  }

  // Fetch both users' watched films with score + title
  const [{ data: myRaw }, { data: partnerRaw }] = await Promise.all([
    supabase.from('user_films')
      .select('tmdb_id, score, film:films_cache(title)')
      .eq('user_id', user.id)
      .eq('status', 'watched'),
    supabase.from('user_films')
      .select('tmdb_id, score, film:films_cache(title)')
      .eq('user_id', partnerId)
      .eq('status', 'watched'),
  ])

  const myFilms = (myRaw ?? []) as unknown as WatchedEntry[]
  const partnerFilms = (partnerRaw ?? []) as unknown as WatchedEntry[]

  const myMap = new Map(myFilms.map(f => [f.tmdb_id, f]))
  const partnerMap = new Map(partnerFilms.map(f => [f.tmdb_id, f]))

  // Find films both users scored ≥7
  const mutualFavorites: { tmdb_id: number; title: string; combinedScore: number }[] = []
  myMap.forEach((myEntry, id) => {
    const partnerEntry = partnerMap.get(id)
    if (!myEntry.score || !partnerEntry?.score) return
    if (myEntry.score >= 7 && partnerEntry.score >= 7) {
      mutualFavorites.push({
        tmdb_id: id,
        title: myEntry.film?.title ?? '',
        combinedScore: myEntry.score + partnerEntry.score,
      })
    }
  })

  if (mutualFavorites.length < 1) return NextResponse.json([])

  // Take top 5 seeds by combined score
  mutualFavorites.sort((a, b) => b.combinedScore - a.combinedScore)
  const seeds = mutualFavorites.slice(0, 5)

  // Fetch all tmdb_ids for both users (watched + wishlist) to exclude
  const [{ data: myAll }, { data: partnerAll }] = await Promise.all([
    supabase.from('user_films').select('tmdb_id').eq('user_id', user.id),
    supabase.from('user_films').select('tmdb_id').eq('user_id', partnerId),
  ])

  const excludeIds = new Set<number>([
    ...(myAll ?? []).map((r: { tmdb_id: number }) => r.tmdb_id),
    ...(partnerAll ?? []).map((r: { tmdb_id: number }) => r.tmdb_id),
  ])

  // Fetch TMDB recommendations for all seeds in parallel
  const settled = await Promise.allSettled(
    seeds.map(seed =>
      fetchRecommendations(seed.tmdb_id).then(results => ({ seed, results }))
    )
  )

  const seen = new Set<number>()
  const suggestions: {
    film: { tmdb_id: number; title: string; poster_url: string | null; year: number | null }
    reason: string
  }[] = []

  for (const result of settled) {
    if (suggestions.length >= 8) break
    if (result.status !== 'fulfilled') continue
    const { seed, results } = result.value
    for (const movie of results) {
      if (suggestions.length >= 8) break
      if (excludeIds.has(movie.id) || seen.has(movie.id)) continue
      seen.add(movie.id)
      const year = movie.release_date ? parseInt(movie.release_date.slice(0, 4)) : null
      suggestions.push({
        film: { tmdb_id: movie.id, title: movie.title, poster_url: posterUrl(movie.poster_path), year },
        reason: `Because you both loved ${seed.title}`,
      })
    }
  }

  return NextResponse.json(suggestions)
}
