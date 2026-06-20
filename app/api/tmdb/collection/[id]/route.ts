import { NextRequest, NextResponse } from 'next/server'
import { fetchCollection } from '@/lib/tmdb'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const data = await fetchCollection(Number(id))
    return NextResponse.json({ name: data.name, parts: data.parts })
  } catch {
    return NextResponse.json({ name: '', parts: [] })
  }
}
