import { NextRequest, NextResponse } from 'next/server'
import {
  fetchTrending, fetchTopRated, fetchByGenre, fetchGenres,
  fetchNowPlaying, fetchUpcoming, fetchByDecade,
  fetchClassics, fetchHiddenGems, fetchRecentFavorites,
  fetchDiscover, fetchSurprise,
} from '@/lib/tmdb'

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get('type') ?? 'trending'
  const genre = req.nextUrl.searchParams.get('genre')
  const decade = req.nextUrl.searchParams.get('decade')
  const sort = req.nextUrl.searchParams.get('sort') ?? 'popularity.desc'
  const page = Number(req.nextUrl.searchParams.get('page') ?? '1')

  try {
    if (type === 'trending')        return NextResponse.json(await fetchTrending())
    if (type === 'top_rated')       return NextResponse.json(await fetchTopRated())
    if (type === 'now_playing')     return NextResponse.json(await fetchNowPlaying())
    if (type === 'upcoming')        return NextResponse.json(await fetchUpcoming())
    if (type === 'classics')        return NextResponse.json(await fetchClassics())
    if (type === 'hidden_gems')     return NextResponse.json(await fetchHiddenGems())
    if (type === 'recent')          return NextResponse.json(await fetchRecentFavorites())
    if (type === 'surprise')        return NextResponse.json(await fetchSurprise())
    if (type === 'genres')          return NextResponse.json(await fetchGenres())
    if (type === 'genre' && genre)  return NextResponse.json(await fetchByGenre(Number(genre)))
    if (type === 'decade' && decade) return NextResponse.json(await fetchByDecade(Number(decade)))
    if (type === 'discover') {
      const result = await fetchDiscover({
        sort_by: sort,
        genre: genre ? Number(genre) : undefined,
        decade: decade ? Number(decade) : undefined,
        page,
      })
      return NextResponse.json(result)
    }
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch {
    return NextResponse.json({ error: 'TMDB error' }, { status: 500 })
  }
}
