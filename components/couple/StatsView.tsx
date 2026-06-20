'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  ScatterChart, Scatter, ReferenceLine,
} from 'recharts'

interface FilmMeta {
  title: string
  genres: string[] | null
  year: number | null
  poster_url: string | null
}

interface WatchedEntry {
  tmdb_id: number
  score: number | null
  film: FilmMeta | null
}

interface Stats {
  myCount: number
  partnerCount: number
  bothCount: number
  myAvg: number | null
  partnerAvg: number | null
  tasteMatch: number
  ratingDist: { score: number; you: number; partner: number }[]
  genreData: { genre: string; you: number; partner: number }[]
  scatter: { my: number; partner: number; title: string }[]
  partnerPicks: { tmdb_id: number; title: string; poster_url: string | null; year: number | null; score: number }[]
  disagreements: { title: string; my: number; partner: number; diff: number }[]
}

const tooltipStyle = {
  contentStyle: { background: '#13131c', border: '1px solid #2a2a3a', borderRadius: 8, fontSize: 12 },
  labelStyle: { color: '#888' },
  cursor: { fill: 'rgba(255,255,255,0.03)' },
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-bg-card border border-bg-border rounded-xl p-4 text-center">
      <p className="text-2xl font-bold text-cinema-red">{value}</p>
      <p className="text-xs text-text-muted mt-1">{label}</p>
    </div>
  )
}

export default function StatsView({ partnerId }: { partnerId: string }) {
  const [stats, setStats] = useState<Stats | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [{ data: myRaw }, { data: partnerRaw }] = await Promise.all([
        supabase.from('user_films')
          .select('tmdb_id, score, film:films_cache(title, genres, year, poster_url)')
          .eq('user_id', user.id)
          .eq('status', 'watched'),
        supabase.from('user_films')
          .select('tmdb_id, score, film:films_cache(title, genres, year, poster_url)')
          .eq('user_id', partnerId)
          .eq('status', 'watched'),
      ])

      const myFilms = (myRaw ?? []) as unknown as WatchedEntry[]
      const partnerFilms = (partnerRaw ?? []) as unknown as WatchedEntry[]

      const myMap = new Map(myFilms.map(f => [f.tmdb_id, f]))
      const partnerMap = new Map(partnerFilms.map(f => [f.tmdb_id, f]))

      const avg = (scores: number[]) =>
        scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10 : null

      const myScores = myFilms.map(f => f.score).filter((s): s is number => s !== null)
      const partnerScores = partnerFilms.map(f => f.score).filter((s): s is number => s !== null)

      // Films both watched
      const bothIds = [...myMap.keys()].filter(id => partnerMap.has(id))

      // Scatter + taste match
      const scatter = bothIds
        .map(id => {
          const my = myMap.get(id)!.score
          const partner = partnerMap.get(id)!.score
          if (my === null || partner === null) return null
          return { my, partner, title: myMap.get(id)!.film?.title ?? '' }
        })
        .filter((x): x is { my: number; partner: number; title: string } => x !== null)

      const withinOne = scatter.filter(p => Math.abs(p.my - p.partner) <= 1).length
      const tasteMatch = scatter.length > 0 ? Math.round(withinOne / scatter.length * 100) : 0

      // Rating distribution (buckets 1–10)
      const ratingDist = Array.from({ length: 10 }, (_, i) => ({ score: i + 1, you: 0, partner: 0 }))
      const bucket = (score: number) => Math.min(9, Math.max(0, Math.round(score) - 1))
      myFilms.forEach(f => { if (f.score !== null) ratingDist[bucket(f.score)].you++ })
      partnerFilms.forEach(f => { if (f.score !== null) ratingDist[bucket(f.score)].partner++ })

      // Genre breakdown
      const myGenres = new Map<string, number>()
      const partnerGenres = new Map<string, number>()
      myFilms.forEach(f => (f.film?.genres ?? []).forEach(g => myGenres.set(g, (myGenres.get(g) ?? 0) + 1)))
      partnerFilms.forEach(f => (f.film?.genres ?? []).forEach(g => partnerGenres.set(g, (partnerGenres.get(g) ?? 0) + 1)))
      const allGenres = [...new Set([...myGenres.keys(), ...partnerGenres.keys()])]
      const genreData = allGenres
        .map(g => ({ genre: g, you: myGenres.get(g) ?? 0, partner: partnerGenres.get(g) ?? 0 }))
        .sort((a, b) => (b.you + b.partner) - (a.you + a.partner))
        .slice(0, 7)

      // Partner's top picks I haven't watched
      const myWatchedIds = new Set(myMap.keys())
      const partnerPicks = partnerFilms
        .filter(f => !myWatchedIds.has(f.tmdb_id) && f.score !== null && f.film !== null)
        .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
        .slice(0, 5)
        .map(f => ({
          tmdb_id: f.tmdb_id,
          title: f.film!.title,
          poster_url: f.film!.poster_url,
          year: f.film!.year,
          score: f.score!,
        }))

      // Biggest score gaps
      const disagreements = [...scatter]
        .sort((a, b) => Math.abs(b.my - b.partner) - Math.abs(a.my - a.partner))
        .slice(0, 5)
        .map(p => ({ title: p.title, my: p.my, partner: p.partner, diff: Math.abs(p.my - p.partner) }))

      setStats({
        myCount: myMap.size,
        partnerCount: partnerMap.size,
        bothCount: bothIds.length,
        myAvg: avg(myScores),
        partnerAvg: avg(partnerScores),
        tasteMatch,
        ratingDist,
        genreData,
        scatter,
        partnerPicks,
        disagreements,
      })
    }
    load()
  }, [partnerId, supabase])

  if (!stats) return <p className="text-text-muted text-sm">Loading stats…</p>

  if (stats.myCount === 0 && stats.partnerCount === 0) {
    return <p className="text-text-muted text-sm">Rate some watched films to see stats here.</p>
  }

  return (
    <div className="space-y-5">

      {/* 6 stat cards */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        <StatCard label="You watched" value={stats.myCount} />
        <StatCard label="Partner watched" value={stats.partnerCount} />
        <StatCard label="Together" value={stats.bothCount} />
        <StatCard label="Your avg" value={stats.myAvg ?? '—'} />
        <StatCard label="Partner avg" value={stats.partnerAvg ?? '—'} />
        <StatCard label="Taste match" value={`${stats.tasteMatch}%`} />
      </div>

      {/* Rating distribution + Genres */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Rating distribution */}
        {(stats.myCount > 0 || stats.partnerCount > 0) && (
          <div className="bg-bg-card border border-bg-border rounded-xl p-4">
            <p className="text-sm font-semibold mb-0.5">Rating distribution</p>
            <p className="text-xs text-text-muted mb-4">How you each score films 1–10</p>
            <ResponsiveContainer width="100%" height={190}>
              <BarChart data={stats.ratingDist} barCategoryGap="20%" barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a24" vertical={false} />
                <XAxis dataKey="score" tick={{ fill: '#666', fontSize: 11 }} />
                <YAxis tick={{ fill: '#666', fontSize: 11 }} allowDecimals={false} width={24} />
                <Tooltip {...tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                <Bar dataKey="you" name="You" fill="#e50914" radius={[3, 3, 0, 0]} />
                <Bar dataKey="partner" name="Partner" fill="#64748b" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Genre breakdown */}
        {stats.genreData.length > 0 && (
          <div className="bg-bg-card border border-bg-border rounded-xl p-4">
            <p className="text-sm font-semibold mb-0.5">Top genres</p>
            <p className="text-xs text-text-muted mb-4">Films watched by genre</p>
            <ResponsiveContainer width="100%" height={190}>
              <BarChart data={stats.genreData} layout="vertical" barCategoryGap="20%" barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a24" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#666', fontSize: 11 }} allowDecimals={false} />
                <YAxis type="category" dataKey="genre" tick={{ fill: '#999', fontSize: 10 }} width={74} />
                <Tooltip {...tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                <Bar dataKey="you" name="You" fill="#e50914" radius={[0, 3, 3, 0]} />
                <Bar dataKey="partner" name="Partner" fill="#64748b" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Score scatter */}
      {stats.scatter.length > 0 && (
        <div className="bg-bg-card border border-bg-border rounded-xl p-4">
          <p className="text-sm font-semibold mb-0.5">Score comparison</p>
          <p className="text-xs text-text-muted mb-4">Each dot is a film you both rated. Dots on the diagonal = perfect agreement.</p>
          <ResponsiveContainer width="100%" height={260}>
            <ScatterChart margin={{ top: 8, right: 8, bottom: 24, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a24" />
              <XAxis
                dataKey="my" type="number" domain={[0, 10]} name="You"
                tick={{ fill: '#666', fontSize: 11 }}
                label={{ value: 'Your score', position: 'insideBottom', offset: -12, fill: '#555', fontSize: 11 }}
              />
              <YAxis
                dataKey="partner" type="number" domain={[0, 10]} name="Partner"
                tick={{ fill: '#666', fontSize: 11 }}
                label={{ value: "Partner's score", angle: -90, position: 'insideLeft', fill: '#555', fontSize: 11 }}
              />
              <ReferenceLine
                stroke="#333"
                strokeDasharray="4 4"
                segment={[{ x: 0, y: 0 }, { x: 10, y: 10 }] as any}
              />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                content={({ payload }) => {
                  if (!payload?.length) return null
                  const d = payload[0]?.payload
                  return (
                    <div className="bg-bg-elevated border border-bg-border rounded-lg px-3 py-2 text-xs">
                      <p className="text-white font-medium mb-1">{d.title}</p>
                      <p className="text-text-secondary">You: <span className="text-cinema-red">{d.my}</span></p>
                      <p className="text-text-secondary">Partner: <span className="text-slate-400">{d.partner}</span></p>
                    </div>
                  )
                }}
              />
              <Scatter data={stats.scatter} fill="#e50914" opacity={0.85} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Partner's picks + Disagreements */}
      {(stats.partnerPicks.length > 0 || stats.disagreements.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {stats.partnerPicks.length > 0 && (
            <div className="bg-bg-card border border-bg-border rounded-xl p-4">
              <p className="text-sm font-semibold mb-0.5">Partner's picks for you</p>
              <p className="text-xs text-text-muted mb-3">Films they loved that you haven't seen</p>
              <div className="space-y-3">
                {stats.partnerPicks.map(film => (
                  <div key={film.tmdb_id} className="flex items-center gap-3">
                    {film.poster_url ? (
                      <img src={film.poster_url} alt={film.title} className="w-8 h-12 object-cover rounded flex-shrink-0" />
                    ) : (
                      <div className="w-8 h-12 rounded bg-bg-elevated flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{film.title}</p>
                      {film.year && <p className="text-xs text-text-muted">{film.year}</p>}
                    </div>
                    <span className="text-cinema-red font-bold text-sm flex-shrink-0">{film.score}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {stats.disagreements.length > 0 && (
            <div className="bg-bg-card border border-bg-border rounded-xl p-4">
              <p className="text-sm font-semibold mb-0.5">Biggest disagreements</p>
              <p className="text-xs text-text-muted mb-3">Films where your scores diverge the most</p>
              <div className="space-y-3">
                {stats.disagreements.map((film, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{film.title}</p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0 text-xs font-medium">
                      <span className="text-cinema-red">{film.my}</span>
                      <span className="text-text-muted">vs</span>
                      <span className="text-slate-400">{film.partner}</span>
                      {film.diff > 0 && (
                        <span className="text-text-muted font-normal ml-0.5">(Δ{film.diff})</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
