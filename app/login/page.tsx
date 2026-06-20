'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/discover')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-base">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-full bg-cinema-red" />
          <span className="text-xl font-bold tracking-wide">CineTrack</span>
        </div>
        <h1 className="text-2xl font-semibold mb-6">Sign in</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="bg-bg-elevated border border-bg-border rounded-lg px-4 py-3 text-sm outline-none focus:border-cinema-red transition-colors"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="bg-bg-elevated border border-bg-border rounded-lg px-4 py-3 text-sm outline-none focus:border-cinema-red transition-colors"
          />
          {error && <p className="text-cinema-red text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="bg-cinema-red text-white rounded-lg py-3 text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p className="text-text-secondary text-sm mt-4 text-center">
          No account?{' '}
          <Link href="/register" className="text-white hover:text-cinema-red transition-colors">
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}
