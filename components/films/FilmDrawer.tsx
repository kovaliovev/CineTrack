// components/films/FilmDrawer.tsx
'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { useFilmStatus } from '@/hooks/useFilmStatus'
import RatingPicker from './RatingPicker'
import TrailerButton from './TrailerButton'
import CommentsSection from '@/components/comments/CommentsSection'
import type { FilmCardStatus } from '@/lib/types'

interface FilmDetail {
  id: number
  title: string
  poster_url: string | null
  year: number | null
  runtime: number | null
  genres: string[]
  director: string | null
  overview: string
  trailer_key: string | null
}

interface Props {
  tmdbId: number
  onClose: () => void
}

export default function FilmDrawer({ tmdbId, onClose }: Props) {
  const [detail, setDetail] = useState<FilmDetail | null>(null)
  const [myInitial, setMyInitial] = useState<FilmCardStatus>({ status: null, score: null })
  const [partnerStatus, setPartnerStatus] = useState<FilmCardStatus>({ status: null, score: null })
  const [userId, setUserId] = useState<string>('')
  const [showPicker, setShowPicker] = useState(false)
  const [visible, setVisible] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    // Load film detail from TMDB proxy
    fetch(`/api/tmdb/film/${tmdbId}`)
      .then(r => r.json())
      .then(d => { if (!d.error) setDetail(d) })

    // Load current user
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return
      setUserId(data.user.id)

      // Load my status
      supabase.from('user_films').select('status, score')
        .eq('tmdb_id', tmdbId)
        .eq('user_id', data.user.id)
        .maybeSingle()
        .then(({ data: uf }) => {
          if (uf) setMyInitial({ status: uf.status, score: uf.score })
        })

      // Load partner's status (RLS allows reading partner rows)
      supabase.from('user_films').select('status, score, user_id')
        .eq('tmdb_id', tmdbId)
        .neq('user_id', data.user.id)
        .maybeSingle()
        .then(({ data: uf }) => {
          if (uf) setPartnerStatus({ status: uf.status, score: uf.score })
        })
    })
  }, [tmdbId])

  const { status: myStatus, addToWishlist, markWatched, removeFromList } = useFilmStatus(
    tmdbId,
    myInitial,
    detail
      ? { title: detail.title, poster_url: detail.poster_url, year: detail.year, genres: detail.genres }
      : { title: '', poster_url: null, year: null, genres: [] }
  )

  async function handleWatched(score: number) {
    await markWatched(score)
    setShowPicker(false)
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 z-40 transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div className={`fixed right-0 top-0 h-full w-full max-w-lg bg-bg-card border-l border-bg-border z-50 overflow-y-auto transition-transform duration-300 ${visible ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-bg-elevated flex items-center justify-center text-text-muted hover:text-white transition-colors z-10"
          aria-label="Close"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>

        {!detail ? (
          <div className="p-6 animate-pulse">
            <div className="flex gap-5 mb-6">
              <div className="w-28 flex-shrink-0 aspect-[2/3] rounded-lg bg-bg-elevated" />
              <div className="flex-1 pt-1 space-y-3">
                <div className="h-5 bg-bg-elevated rounded w-3/4" />
                <div className="h-3 bg-bg-elevated rounded w-1/3" />
                <div className="flex gap-1.5 mt-2">
                  <div className="h-5 bg-bg-elevated rounded w-14" />
                  <div className="h-5 bg-bg-elevated rounded w-16" />
                  <div className="h-5 bg-bg-elevated rounded w-12" />
                </div>
                <div className="h-3 bg-bg-elevated rounded w-1/4 mt-1" />
              </div>
            </div>
            <div className="space-y-2 mb-6">
              <div className="h-3 bg-bg-elevated rounded" />
              <div className="h-3 bg-bg-elevated rounded" />
              <div className="h-3 bg-bg-elevated rounded w-4/5" />
            </div>
            <div className="h-10 bg-bg-elevated rounded-xl mb-3" />
            <div className="h-10 bg-bg-elevated rounded-xl" />
          </div>
        ) : (
          <div className="p-6">
            {/* Header */}
            <div className="flex gap-5 mb-6">
              {detail.poster_url && (
                <div className="relative w-28 flex-shrink-0 aspect-[2/3] rounded-lg overflow-hidden">
                  <Image src={detail.poster_url} alt={detail.title} fill className="object-cover" sizes="112px" />
                </div>
              )}
              <div className="flex-1 min-w-0 pt-1">
                <h2 className="text-lg font-bold text-text-primary leading-tight">{detail.title}</h2>
                <div className="flex items-center gap-2 mt-1 text-sm text-text-muted flex-wrap">
                  {detail.year && <span>{detail.year}</span>}
                  {detail.runtime && <span>{detail.runtime} min</span>}
                </div>
                {detail.genres.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {detail.genres.map(g => (
                      <span key={g} className="text-xs bg-bg-elevated px-2 py-0.5 rounded text-text-secondary">{g}</span>
                    ))}
                  </div>
                )}
                {detail.director && (
                  <p className="text-xs text-text-muted mt-2">Dir. {detail.director}</p>
                )}
              </div>
            </div>

            {/* Overview */}
            {detail.overview && (
              <p className="text-sm text-text-secondary leading-relaxed mb-5">{detail.overview}</p>
            )}

            {/* Trailer */}
            {detail.trailer_key && (
              <div className="mb-5">
                <TrailerButton trailerKey={detail.trailer_key} />
              </div>
            )}

            {/* My status */}
            <div className="bg-bg-elevated rounded-xl p-4 mb-3">
              <p className="text-xs text-text-muted mb-3">Your status</p>
              {showPicker ? (
                <RatingPicker
                  value={myStatus.score}
                  onChange={handleWatched}
                  onCancel={() => setShowPicker(false)}
                />
              ) : myStatus.status === 'watched' ? (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm font-medium text-emerald-400">✓ Watched</span>
                    {myStatus.score !== null && (
                      <span className="text-sm font-bold text-cinema-red">
                        {myStatus.score}<span className="text-text-muted font-normal text-xs">/10</span>
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowPicker(true)}
                      className="text-xs px-3 py-1.5 bg-bg-base rounded-lg text-text-secondary hover:text-white transition-colors"
                    >
                      Change rating
                    </button>
                    <button
                      onClick={removeFromList}
                      className="text-xs px-3 py-1.5 bg-bg-base rounded-lg text-text-muted hover:text-red-400 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : myStatus.status === 'wishlist' ? (
                <div>
                  <div className="flex items-center gap-1.5 mb-3">
                    <span className="text-sm font-medium text-cinema-red">♥ In Wishlist</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowPicker(true)}
                      className="text-xs px-3 py-1.5 bg-cinema-red text-white rounded-lg hover:opacity-90 transition-opacity"
                    >
                      ✓ Mark Watched
                    </button>
                    <button
                      onClick={removeFromList}
                      className="text-xs px-3 py-1.5 bg-bg-base rounded-lg text-text-muted hover:text-red-400 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={addToWishlist}
                    className="text-xs px-3 py-1.5 bg-bg-base rounded-lg text-text-secondary hover:text-white border border-bg-border hover:border-cinema-red transition-colors"
                  >
                    + Wishlist
                  </button>
                  <button
                    onClick={() => setShowPicker(true)}
                    className="text-xs px-3 py-1.5 bg-cinema-red text-white rounded-lg hover:opacity-90 transition-opacity"
                  >
                    ✓ Mark Watched
                  </button>
                </div>
              )}
            </div>

            {/* Partner's status */}
            <div className="bg-bg-elevated rounded-xl p-4 mb-5">
              <p className="text-xs text-text-muted mb-2">Partner's status</p>
              <span className="text-sm text-text-secondary">
                {partnerStatus.status === 'watched'
                  ? `Watched · ${partnerStatus.score}`
                  : partnerStatus.status === 'wishlist'
                  ? 'In wishlist'
                  : 'Not seen yet'}
              </span>
            </div>

            {/* Comments */}
            {userId && <CommentsSection tmdbId={tmdbId} currentUserId={userId} />}
          </div>
        )}
      </div>
    </>
  )
}
