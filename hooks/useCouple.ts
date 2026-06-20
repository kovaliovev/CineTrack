'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useCouple() {
  const [partnerId, setPartnerId] = useState<string | null>(null)
  const [coupleId, setCoupleId] = useState<string | null>(null)
  const [inviteCode, setInviteCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/couple').then(r => r.json()).then(({ couple }) => {
      if (!couple) { setLoading(false); return }
      setCoupleId(couple.id)
      setInviteCode(couple.invite_code)

      const supabase = createClient()
      supabase.auth.getUser().then(({ data }) => {
        const myId = data.user?.id
        const partnerId = couple.user1_id === myId ? couple.user2_id : couple.user1_id
        setPartnerId(partnerId)
        setLoading(false)
      })
    })
  }, [])

  return { partnerId, coupleId, inviteCode, loading }
}
