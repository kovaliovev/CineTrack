import { NextRequest, NextResponse } from 'next/server'
import { fetchFilmDetail, posterUrl, trailerKey, directorName, directorId } from '@/lib/tmdb'
import { createClient } from '@/lib/supabase/server'
import type { TMDBMovieDetail } from '@/lib/types'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  let detail: TMDBMovieDetail
  try {
    detail = await fetchFilmDetail(Number(id))
  } catch {
    return NextResponse.json({ error: 'Film not found' }, { status: 404 })
  }

  // Cache upsert is best-effort — don't fail the request if it errors
  const supabase = await createClient()
  try {
    await supabase.from('films_cache').upsert({
      tmdb_id: detail.id,
      title: detail.title,
      poster_url: posterUrl(detail.poster_path),
      year: detail.release_date ? Number(detail.release_date.slice(0, 4)) : null,
      genres: detail.genres.map((g: { name: string }) => g.name),
      runtime: detail.runtime,
      overview: detail.overview,
      director: directorName(detail),
    }, { onConflict: 'tmdb_id' })
  } catch {
    // Silently ignore cache write failures
  }

  return NextResponse.json({
    ...detail,
    poster_url: posterUrl(detail.poster_path),
    year: detail.release_date ? Number(detail.release_date.slice(0, 4)) : null,
    genres: detail.genres.map((g: { name: string }) => g.name),
    director: directorName(detail),
    director_id: directorId(detail),
    trailer_key: trailerKey(detail),
  })
}
