'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import { createClient } from '@/lib/supabase/client'
import { useCouple } from '@/hooks/useCouple'

export default function ProfilePage() {
  const router = useRouter()
  const { inviteCode, partnerId, loading } = useCouple()
  const [code, setCode] = useState('')
  const [joinError, setJoinError] = useState('')
  const [createError, setCreateError] = useState('')
  const [creating, setCreating] = useState(false)

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  async function createCouple() {
    setCreating(true)
    setCreateError('')
    const res = await fetch('/api/couple', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'create' }) })
    if (res.ok) {
      window.location.reload()
    } else {
      try {
        const d = await res.json()
        setCreateError(d?.error ?? 'Failed to create couple')
      } catch {
        setCreateError('Failed to create couple')
      }
      setCreating(false)
    }
  }

  async function joinCouple(e: React.FormEvent) {
    e.preventDefault()
    setJoinError('')
    const res = await fetch('/api/couple', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'join', invite_code: code.trim() }),
    })
    if (!res.ok) {
      try {
        const d = await res.json()
        setJoinError(d?.error ?? 'Failed to join')
      } catch {
        setJoinError('Failed to join')
      }
    } else {
      window.location.reload()
    }
  }

  return (
    <AppShell>
      <div className="p-6 max-w-md mx-auto">
        <h1 className="text-lg font-bold mb-6">Profile</h1>

        {/* Couple section */}
        <div className="bg-bg-card border border-bg-border rounded-xl p-5 mb-4">
          <h2 className="text-sm font-semibold mb-4">Couple</h2>

          {loading ? (
            <p className="text-text-muted text-sm">Loading…</p>
          ) : inviteCode ? (
            <div>
              <p className="text-xs text-text-muted mb-1">Your invite code</p>
              <div className="flex items-center gap-2">
                <code className="bg-bg-elevated px-3 py-2 rounded-lg text-cinema-red font-mono text-sm tracking-widest">
                  {inviteCode}
                </code>
                <button
                  onClick={() => navigator.clipboard.writeText(inviteCode)}
                  className="text-xs text-text-muted hover:text-white transition-colors"
                >
                  Copy
                </button>
              </div>
              {partnerId ? (
                <p className="text-xs text-text-secondary mt-3">✓ Linked to your partner</p>
              ) : (
                <p className="text-xs text-text-muted mt-3">Share this code with your partner</p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-text-secondary mb-2">Create a new couple and get an invite code:</p>
                <button
                  onClick={createCouple}
                  disabled={creating}
                  className="bg-cinema-red text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {creating ? 'Creating…' : 'Create couple'}
                </button>
                {createError && <p className="text-cinema-red text-xs mt-2">{createError}</p>}
              </div>
              <div>
                <p className="text-sm text-text-secondary mb-2">Or join with a partner's invite code:</p>
                <form onSubmit={joinCouple} className="flex gap-2">
                  <input
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    placeholder="Enter invite code"
                    className="flex-1 bg-bg-elevated border border-bg-border rounded-lg px-3 py-2 text-sm outline-none focus:border-cinema-red transition-colors font-mono"
                  />
                  <button
                    type="submit"
                    className="bg-bg-elevated border border-bg-border text-sm px-3 py-2 rounded-lg hover:border-cinema-red transition-colors"
                  >
                    Join
                  </button>
                </form>
                {joinError && <p className="text-cinema-red text-xs mt-1">{joinError}</p>}
              </div>
            </div>
          )}
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full bg-bg-elevated border border-bg-border text-text-secondary hover:text-white hover:border-bg-border py-3 rounded-xl text-sm transition-colors"
        >
          Sign out
        </button>
      </div>
    </AppShell>
  )
}
