// components/couple/StatsView.tsx
'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

export default function StatsView({ partnerId }: { partnerId: string }) {
  const [stats, setStats] = useState<{
    myCount: number
    herCount: number
    myAvg: number | null
    herAvg: number | null
    overlap: number
    scatter: { my: number; her: number; title: string }[]
  } | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [{ data: mine }, { data: hers }] = await Promise.all([
        supabase.from('user_films').select('tmdb_id, score, status').eq('user_id', user.id).eq('status', 'watched'),
        supabase.from('user_films').select('tmdb_id, score, status').eq('user_id', partnerId).eq('status', 'watched'),
      ])

      const myMap = new Map((mine ?? []).map((r: any) => [r.tmdb_id, r.score]))
      const herMap = new Map((hers ?? []).map((r: any) => [r.tmdb_id, r.score]))

      const myScores = [...myMap.values()].filter((s): s is number => s !== null)
      const herScores = [...herMap.values()].filter((s): s is number => s !== null)

      const bothIds = [...myMap.keys()].filter(id => herMap.has(id))
      const { data: films } = await supabase.from('films_cache').select('tmdb_id, title').in('tmdb_id', bothIds)
      const filmMap = new Map((films ?? []).map((f: any) => [f.tmdb_id, f.title]))

      const scatter = bothIds
        .filter(id => myMap.get(id) !== null && herMap.get(id) !== null)
        .map(id => ({ my: myMap.get(id)!, her: herMap.get(id)!, title: filmMap.get(id) ?? '' }))

      const withinOne = scatter.filter(p => Math.abs(p.my - p.her) <= 1).length
      const overlap = scatter.length > 0 ? Math.round((withinOne / scatter.length) * 100) : 0

      const avg = (arr: number[]) => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length * 10) / 10 : null

      setStats({
        myCount: myMap.size,
        herCount: herMap.size,
        myAvg: avg(myScores),
        herAvg: avg(herScores),
        overlap,
        scatter,
      })
    }
    load()
  }, [partnerId, supabase])

  if (!stats) return <p className="text-text-muted text-sm">Loading stats…</p>

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'You watched', value: stats.myCount },
          { label: 'She watched', value: stats.herCount },
          { label: 'Your avg', value: stats.myAvg ?? '—' },
          { label: 'Her avg', value: stats.herAvg ?? '—' },
        ].map(({ label, value }) => (
          <div key={label} className="bg-bg-card border border-bg-border rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-cinema-red">{value}</p>
            <p className="text-xs text-text-muted mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="bg-bg-card border border-bg-border rounded-xl p-4">
        <p className="text-sm font-semibold mb-1">Taste overlap</p>
        <p className="text-xs text-text-muted mb-3">Films where your scores are within 1 point</p>
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-bg-base rounded-full h-2">
            <div
              className="h-2 rounded-full bg-cinema-red transition-all"
              style={{ width: `${stats.overlap}%` }}
            />
          </div>
          <span className="text-cinema-red font-bold text-sm">{stats.overlap}%</span>
        </div>
      </div>

      {stats.scatter.length > 0 && (
        <div className="bg-bg-card border border-bg-border rounded-xl p-4">
          <p className="text-sm font-semibold mb-1">Score comparison</p>
          <p className="text-xs text-text-muted mb-4">Each dot = a film you both rated. Diagonal = you agreed.</p>
          <ResponsiveContainer width="100%" height={280}>
            <ScatterChart margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a24" />
              <XAxis dataKey="my" type="number" domain={[0, 10]} name="You" tick={{ fill: '#666', fontSize: 11 }} label={{ value: 'Your score', position: 'insideBottom', offset: -4, fill: '#555', fontSize: 11 }} />
              <YAxis dataKey="her" type="number" domain={[0, 10]} name="Her" tick={{ fill: '#666', fontSize: 11 }} label={{ value: 'Her score', angle: -90, position: 'insideLeft', fill: '#555', fontSize: 11 }} />
              <ReferenceLine stroke="#333" strokeDasharray="4 4" segment={[{ x: 0, y: 0 }, { x: 10, y: 10 }] as any} />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                content={({ payload }) => {
                  if (!payload?.length) return null
                  const d = payload[0]?.payload
                  return (
                    <div className="bg-bg-elevated border border-bg-border rounded-lg px-3 py-2 text-xs">
                      <p className="text-white font-medium mb-1">{d.title}</p>
                      <p className="text-text-secondary">You: <span className="text-cinema-red">{d.my}</span></p>
                      <p className="text-text-secondary">Her: <span className="text-cinema-red">{d.her}</span></p>
                    </div>
                  )
                }}
              />
              <Scatter data={stats.scatter} fill="#e50914" opacity={0.8} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
