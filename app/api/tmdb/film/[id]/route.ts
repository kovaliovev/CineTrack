import { NextRequest, NextResponse } from 'next/server'
import { fetchFilmDetail, posterUrl, trailerKey, directorName } from '@/lib/tmdb'
import { createClient } from '@/lib/supabase/server'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const detail = await fetchFilmDetail(Number(id))

    const supabase = await createClient()
    await supabase.from('films_cache').upsert({
      tmdb_id: detail.id,
      title: detail.title,
      poster_url: posterUrl(detail.poster_path),
      year: detail.release_date ? Number(detail.release_date.slice(0, 4)) : null,
      genres: detail.genres.map(g => g.name),
      runtime: detail.runtime,
      overview: detail.overview,
      director: directorName(detail),
    }, { onConflict: 'tmdb_id' })

    return NextResponse.json({
      ...detail,
      poster_url: posterUrl(detail.poster_path),
      year: detail.release_date ? Number(detail.release_date.slice(0, 4)) : null,
      genres: detail.genres.map(g => g.name),
      director: directorName(detail),
      trailer_key: trailerKey(detail),
    })
  } catch {
    return NextResponse.json({ error: 'Film not found' }, { status: 404 })
  }
}
