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
