import { NextRequest, NextResponse } from 'next/server'
import {
  fetchTrending, fetchTopRated, fetchByGenre, fetchGenres,
  fetchNowPlaying, fetchUpcoming, fetchPopular, fetchAcclaimed, fetchByDecade,
} from '@/lib/tmdb'

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get('type') ?? 'trending'
  const genre = req.nextUrl.searchParams.get('genre')
  const decade = req.nextUrl.searchParams.get('decade')

  try {
    if (type === 'trending')    return NextResponse.json(await fetchTrending())
    if (type === 'top_rated')   return NextResponse.json(await fetchTopRated())
    if (type === 'popular')     return NextResponse.json(await fetchPopular())
    if (type === 'now_playing') return NextResponse.json(await fetchNowPlaying())
    if (type === 'upcoming')    return NextResponse.json(await fetchUpcoming())
    if (type === 'acclaimed')   return NextResponse.json(await fetchAcclaimed())
    if (type === 'genres')      return NextResponse.json(await fetchGenres())
    if (type === 'genre' && genre) return NextResponse.json(await fetchByGenre(Number(genre)))
    if (type === 'decade' && decade) return NextResponse.json(await fetchByDecade(Number(decade)))
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch {
    return NextResponse.json({ error: 'TMDB error' }, { status: 500 })
  }
}
