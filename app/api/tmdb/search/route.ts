import { NextRequest, NextResponse } from 'next/server'
import { fetchSearch } from '@/lib/tmdb'

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q') ?? ''
  try {
    return NextResponse.json(await fetchSearch(query))
  } catch {
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
