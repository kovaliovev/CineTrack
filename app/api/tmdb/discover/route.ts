import { NextRequest, NextResponse } from 'next/server'
import { fetchTrending, fetchTopRated, fetchByGenre, fetchGenres } from '@/lib/tmdb'

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get('type') ?? 'trending'
  const genre = req.nextUrl.searchParams.get('genre')

  try {
    if (type === 'trending') return NextResponse.json(await fetchTrending())
    if (type === 'top_rated') return NextResponse.json(await fetchTopRated())
    if (type === 'genre' && genre) return NextResponse.json(await fetchByGenre(Number(genre)))
    if (type === 'genres') return NextResponse.json(await fetchGenres())
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch {
    return NextResponse.json({ error: 'TMDB error' }, { status: 500 })
  }
}
