import { NextRequest, NextResponse } from 'next/server'
import { fetchRecommendations } from '@/lib/tmdb'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const films = await fetchRecommendations(Number(id))
    return NextResponse.json(films)
  } catch {
    return NextResponse.json([])
  }
}
