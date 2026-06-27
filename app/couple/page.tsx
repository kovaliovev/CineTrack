// app/couple/page.tsx
'use client'
import { useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import WatchTonight from '@/components/couple/WatchTonight'
import StatsView from '@/components/couple/StatsView'
import { useCouple } from '@/hooks/useCouple'

type Tab = 'match' | 'stats'

export default function CouplePage() {
  const [tab, setTab] = useState<Tab>('match')
  const { partnerId, loading } = useCouple()

  if (loading) return <AppShell><div className="p-4 sm:p-6 text-text-muted text-sm">Loading…</div></AppShell>
  if (!partnerId) return (
    <AppShell>
      <div className="p-4 sm:p-6">
        <h1 className="text-lg font-bold mb-3">Couple</h1>
        <p className="text-text-muted text-sm">Not linked to a partner yet. Share your invite code from Profile.</p>
      </div>
    </AppShell>
  )

  return (
    <AppShell>
      <div className="p-4 sm:p-6 max-w-screen-xl mx-auto">
        <h1 className="text-lg font-bold mb-5">Couple</h1>

        <div className="flex gap-1 bg-bg-elevated rounded-lg p-1 w-fit mb-6">
          <button
            onClick={() => setTab('match')}
            className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${tab === 'match' ? 'bg-cinema-red text-white' : 'text-text-secondary hover:text-white'}`}
          >
            Watch Tonight?
          </button>
          <button
            onClick={() => setTab('stats')}
            className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${tab === 'stats' ? 'bg-cinema-red text-white' : 'text-text-secondary hover:text-white'}`}
          >
            Stats
          </button>
        </div>

        {tab === 'match' ? <WatchTonight partnerId={partnerId} /> : <StatsView partnerId={partnerId} />}
      </div>
    </AppShell>
  )
}
