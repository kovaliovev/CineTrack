import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { action, invite_code } = body

  if (action === 'create') {
    // Create a new couple with this user as user1
    const { data, error } = await supabase
      .from('couples')
      .insert({ user1_id: user.id })
      .select('id, invite_code')
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ couple_id: data.id })
      .eq('id', user.id)
    if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 })

    return NextResponse.json({ invite_code: data.invite_code })
  }

  if (action === 'join') {
    if (!invite_code) return NextResponse.json({ error: 'invite_code required' }, { status: 400 })

    const { data: couple, error } = await supabase
      .from('couples')
      .select('id, user1_id, user2_id')
      .eq('invite_code', invite_code)
      .single()

    if (error || !couple) return NextResponse.json({ error: 'Invalid invite code' }, { status: 404 })
    if (couple.user2_id) return NextResponse.json({ error: 'Couple already full' }, { status: 409 })
    if (couple.user1_id === user.id) return NextResponse.json({ error: 'Cannot join your own couple' }, { status: 400 })

    const { error: coupleUpdateError } = await supabase
      .from('couples')
      .update({ user2_id: user.id })
      .eq('id', couple.id)
    if (coupleUpdateError) return NextResponse.json({ error: coupleUpdateError.message }, { status: 500 })

    const { error: profileUpdateError } = await supabase
      .from('profiles')
      .update({ couple_id: couple.id })
      .eq('id', user.id)
    if (profileUpdateError) return NextResponse.json({ error: profileUpdateError.message }, { status: 500 })

    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('couple_id')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) return NextResponse.json({ couple: null })
  if (!profile.couple_id) return NextResponse.json({ couple: null })

  const { data: couple } = await supabase
    .from('couples')
    .select('id, invite_code, user1_id, user2_id')
    .eq('id', profile.couple_id)
    .single()

  return NextResponse.json({ couple })
}
