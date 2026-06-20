'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Logo from '@/components/ui/Logo'

export default function RegisterPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const trimmed = username.trim().toLowerCase()
    if (!/^[a-z0-9_]{2,20}$/.test(trimmed)) {
      setError('Username must be 2–20 characters: letters, numbers, underscores only')
      setLoading(false)
      return
    }

    const supabase = createClient()
    const email = `${trimmed}@reeltwo.app`

    const { error: signUpError } = await supabase.auth.signUp({ email, password })
    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    // If invite code provided, join couple via API route
    if (inviteCode.trim()) {
      const res = await fetch('/api/couple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'join', invite_code: inviteCode.trim() }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Invalid invite code')
        setLoading(false)
        return
      }
    }

    router.push('/discover')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-base">
      <div className="w-full max-w-sm">
        <div className="mb-10">
          <Logo wordmark size="lg" />
        </div>
        <h1 className="text-2xl font-semibold mb-6">Create account</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
            autoCapitalize="none"
            autoCorrect="off"
            className="bg-bg-elevated border border-bg-border rounded-lg px-4 py-3 text-sm outline-none focus:border-cinema-red transition-colors"
          />
          <input
            type="password"
            placeholder="Password (min 6 chars)"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={6}
            className="bg-bg-elevated border border-bg-border rounded-lg px-4 py-3 text-sm outline-none focus:border-cinema-red transition-colors"
          />
          <div>
            <input
              type="text"
              placeholder="Partner's invite code (optional)"
              value={inviteCode}
              onChange={e => setInviteCode(e.target.value)}
              className="w-full bg-bg-elevated border border-bg-border rounded-lg px-4 py-3 text-sm outline-none focus:border-cinema-red transition-colors font-mono"
            />
            <p className="text-text-muted text-xs mt-1 px-1">
              Leave blank — your invite code will appear in Profile after sign up
            </p>
          </div>
          {error && <p className="text-cinema-red text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="bg-cinema-red text-white rounded-lg py-3 text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>
        <p className="text-text-secondary text-sm mt-4 text-center">
          Already have an account?{' '}
          <Link href="/login" className="text-white hover:text-cinema-red transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
