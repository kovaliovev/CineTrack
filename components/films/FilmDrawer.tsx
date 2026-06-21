// components/films/FilmDrawer.tsx
'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { useFilmStatus } from '@/hooks/useFilmStatus'
import RatingPicker from './RatingPicker'
import TrailerButton from './TrailerButton'
import CommentsSection from '@/components/comments/CommentsSection'
import { posterUrl, profileUrl } from '@/lib/tmdb'
import type { FilmCardStatus, TMDBMovie, CastMember } from '@/lib/types'
import { HScroll } from './HScroll'
import { StatusDot } from './StatusDot'
import ActorPanel from './ActorPanel'

interface DrawerDetail {
  id: number
  title: string
  poster_url: string | null
  year: number | null
  runtime: number | null
  genres: string[]
  director: string | null
  director_id: number | null
  overview: string
  trailer_key: string | null
  belongs_to_collection: { id: number; name: string } | null
  credits: { cast: CastMember[] }
}

interface CollectionState {
  name: string
  films: TMDBMovie[]
}

interface Props {
  tmdbId: number
  onClose: () => void
  onOpenFilm?: (tmdbId: number) => void
}

export default function FilmDrawer({ tmdbId, onClose, onOpenFilm }: Props) {
  const [detail, setDetail]                 = useState<DrawerDetail | null>(null)
  const [myInitial, setMyInitial]           = useState<FilmCardStatus>({ status: null, score: null })
  const [partnerStatus, setPartnerStatus]   = useState<FilmCardStatus>({ status: null, score: null })
  const [userId, setUserId]                 = useState<string>('')
  const [showPicker, setShowPicker]         = useState(false)
  const [visible, setVisible]               = useState(false)
  const [cast, setCast]                     = useState<CastMember[]>([])
  const [collection, setCollection]         = useState<CollectionState | null>(null)
  const [collectionLoading, setCollectionLoading] = useState(false)
  const [collectionStatuses, setCollectionStatuses] = useState<
    Record<number, { mine: FilmCardStatus; partner: FilmCardStatus }>
  >({})
  const [similarFilms, setSimilarFilms]     = useState<TMDBMovie[]>([])
  const [similarLoading, setSimilarLoading] = useState(false)
  const [actorId, setActorId]               = useState<number | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    // Reset so skeleton renders immediately on film change
    setDetail(null)
    setMyInitial({ status: null, score: null })
    setPartnerStatus({ status: null, score: null })
    setShowPicker(false)
    setCast([])
    setCollection(null)
    setCollectionStatuses({})
    setSimilarFilms([])
    setSimilarLoading(true)
    setActorId(null)

    let cancelled = false

    ;(async () => {
      const [detailData, { data: authData }] = await Promise.all([
        fetch(`/api/tmdb/film/${tmdbId}`).then(r => r.json()),
        supabase.auth.getUser(),
      ])

      if (cancelled) return

      if (!detailData.error) setDetail(detailData)

      // Extract top-billed cast from credits (already in response via append_to_response)
      if (Array.isArray(detailData.credits?.cast)) {
        setCast(
          [...detailData.credits.cast as CastMember[]]
            .sort((a, b) => a.order - b.order)
            .slice(0, 8)
        )
      }

      const uid = authData.user?.id ?? ''
      if (uid) setUserId(uid)

      // User film statuses (fire-and-forget, parallel)
      if (uid) {
        supabase.from('user_films').select('status, score')
          .eq('tmdb_id', tmdbId).eq('user_id', uid).maybeSingle()
          .then(({ data: uf }) => { if (!cancelled && uf) setMyInitial({ status: uf.status, score: uf.score }) })

        supabase.from('user_films').select('status, score, user_id')
          .eq('tmdb_id', tmdbId).neq('user_id', uid).maybeSingle()
          .then(({ data: uf }) => { if (!cancelled && uf) setPartnerStatus({ status: uf.status, score: uf.score }) })
      }

      // Collection — fetch only if this film belongs to one
      if (detailData.belongs_to_collection?.id && !cancelled) {
        setCollectionLoading(true)
        try {
          const collRes = await fetch(`/api/tmdb/collection/${detailData.belongs_to_collection.id}`)
          const collData = await collRes.json()
          if (cancelled) return

          const films: TMDBMovie[] = collData.parts ?? []
          setCollection({ name: collData.name, films })

          // Fetch both users' statuses for all collection films
          if (films.length && uid) {
            const { data: ufData } = await supabase.from('user_films')
              .select('tmdb_id, status, score, user_id')
              .in('tmdb_id', films.map(f => f.id))

            if (!cancelled && ufData) {
              const map: Record<number, { mine: FilmCardStatus; partner: FilmCardStatus }> = {}
              films.forEach(f => {
                map[f.id] = { mine: { status: null, score: null }, partner: { status: null, score: null } }
              })
              ufData.forEach(uf => {
                if (!map[uf.tmdb_id]) return
                if (uf.user_id === uid) map[uf.tmdb_id].mine = { status: uf.status, score: uf.score }
                else map[uf.tmdb_id].partner = { status: uf.status, score: uf.score }
              })
              setCollectionStatuses(map)
            }
          }
        } catch {
          // silently ignore collection failures
        } finally {
          if (!cancelled) setCollectionLoading(false)
        }
      }
    })()

    // Similar films — fully parallel
    fetch(`/api/tmdb/film/${tmdbId}/similar`)
      .then(r => r.json())
      .then(data => { if (!cancelled && Array.isArray(data)) setSimilarFilms(data) })
      .catch(() => {})
      .finally(() => { if (!cancelled) setSimilarLoading(false) })

    return () => { cancelled = true }
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

        {actorId !== null ? (
          <ActorPanel
            personId={actorId}
            onBack={() => setActorId(null)}
            onOpenFilm={(id) => { setActorId(null); onOpenFilm?.(id) }}
            userId={userId}
          />
        ) : !detail ? (
          /* ── Skeleton ── */
          <div className="p-4 sm:p-6 animate-pulse">
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
            {/* Cast skeleton */}
            <div className="flex gap-2.5 mb-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex-none w-14 sm:w-16">
                  <div className="aspect-square rounded-lg bg-bg-elevated" />
                  <div className="h-2 bg-bg-elevated rounded mt-2 w-3/4" />
                  <div className="h-2 bg-bg-elevated rounded mt-1 w-1/2" />
                </div>
              ))}
            </div>
            <div className="h-10 bg-bg-elevated rounded-xl mb-3" />
            <div className="h-10 bg-bg-elevated rounded-xl" />
          </div>
        ) : (
          <div className="p-4 sm:p-6 pb-8">

            {/* ── Header ── */}
            <div className="flex gap-4 sm:gap-5 mb-5">
              {detail.poster_url && (
                <div className="relative w-24 sm:w-28 flex-shrink-0 aspect-[2/3] rounded-lg overflow-hidden">
                  <Image src={detail.poster_url} alt={detail.title} fill className="object-cover" sizes="112px" />
                </div>
              )}
              <div className="flex-1 min-w-0 pt-1">
                <h2 className="text-base sm:text-lg font-bold text-text-primary leading-tight">{detail.title}</h2>
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
                  detail.director_id ? (
                    <button
                      onClick={() => setActorId(detail.director_id!)}
                      className="text-xs text-text-muted mt-2 hover:text-white transition-colors cursor-pointer block"
                    >
                      Dir. {detail.director}
                    </button>
                  ) : (
                    <p className="text-xs text-text-muted mt-2">Dir. {detail.director}</p>
                  )
                )}
              </div>
            </div>

            {/* ── Overview ── */}
            {detail.overview && (
              <p className="text-sm text-text-secondary leading-relaxed mb-5">{detail.overview}</p>
            )}

            {/* ── Cast ── */}
            {cast.length > 0 && (
              <div className="mb-5">
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Cast</p>
                <HScroll>
                  {cast.map(member => {
                    const photo = profileUrl(member.profile_path)
                    const initials = member.name.split(' ').map(n => n[0]).slice(0, 2).join('')
                    return (
                      <button
                        key={member.id}
                        onClick={() => setActorId(member.id)}
                        className="flex-none w-14 sm:w-16 text-center hover:opacity-80 transition-opacity cursor-pointer"
                      >
                        <div className="relative aspect-square rounded-lg overflow-hidden bg-bg-elevated">
                          {photo
                            ? <Image src={photo} alt={member.name} fill className="object-cover object-top" sizes="64px" />
                            : (
                              <div className="w-full h-full flex items-center justify-center text-text-muted text-sm font-semibold">
                                {initials}
                              </div>
                            )
                          }
                        </div>
                        <p className="text-[11px] font-medium text-text-primary truncate mt-1.5 leading-tight">{member.name}</p>
                        {member.character && (
                          <p className="text-[10px] text-text-muted truncate leading-tight">as {member.character}</p>
                        )}
                      </button>
                    )
                  })}
                </HScroll>
              </div>
            )}

            {/* ── Collection ── */}
            {(collectionLoading || collection) && (
              <div className="mb-5">
                {collectionLoading && !collection ? (
                  /* collection skeleton */
                  <div className="animate-pulse">
                    <div className="h-3 bg-bg-elevated rounded w-2/5 mb-3" />
                    <div className="flex gap-2.5">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="flex-none w-16 sm:w-[72px]">
                          <div className="aspect-[2/3] rounded-lg bg-bg-elevated" />
                          <div className="flex gap-1 justify-center mt-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-bg-elevated" />
                            <div className="w-2.5 h-2.5 rounded-full bg-bg-elevated" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : collection && collection.films.length > 0 && (
                  <>
                    {/* Header row */}
                    <div className="flex items-center justify-between mb-3 gap-2">
                      <p className="text-xs font-semibold text-text-muted uppercase tracking-wider truncate">
                        {collection.name}
                      </p>
                      {/* Legend */}
                      <div className="flex items-center gap-2 flex-shrink-0 text-[10px] text-text-muted">
                        <span className="text-emerald-400">●</span><span>you</span>
                        <span className="text-emerald-400 ml-1">●</span><span>partner</span>
                      </div>
                    </div>
                    <HScroll>
                      {collection.films.map(film => {
                        const poster = posterUrl(film.poster_path)
                        const isCurrent = film.id === tmdbId
                        const statuses = collectionStatuses[film.id]
                        return (
                          <button
                            key={film.id}
                            onClick={() => !isCurrent && onOpenFilm?.(film.id)}
                            className={`flex-none w-16 sm:w-[72px] text-center group ${isCurrent ? 'cursor-default' : 'cursor-pointer'}`}
                            title={film.title}
                          >
                            <div className={`relative aspect-[2/3] rounded-lg overflow-hidden bg-bg-elevated transition-colors duration-200 ${
                              isCurrent
                                ? 'ring-2 ring-cinema-red ring-offset-1 ring-offset-bg-card'
                                : 'border border-transparent group-hover:border-cinema-red/40'
                            }`}>
                              {poster
                                ? <Image
                                    src={poster}
                                    alt={film.title}
                                    fill
                                    className={`object-cover transition-transform duration-300 ${!isCurrent ? 'group-hover:scale-105' : ''}`}
                                    sizes="72px"
                                  />
                                : <div className="w-full h-full flex items-center justify-center text-text-muted text-[9px] p-1 text-center leading-tight">{film.title}</div>
                              }
                            </div>
                            {/* Status dots */}
                            <div className="flex items-center justify-center gap-1 mt-1.5">
                              <StatusDot filmStatus={statuses?.mine.status ?? null} label="You" />
                              <StatusDot filmStatus={statuses?.partner.status ?? null} label="Partner" />
                            </div>
                          </button>
                        )
                      })}
                    </HScroll>
                  </>
                )}
              </div>
            )}

            {/* ── Trailer ── */}
            {detail.trailer_key && (
              <div className="mb-5">
                <TrailerButton trailerKey={detail.trailer_key} />
              </div>
            )}

            {/* ── My status ── */}
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

            {/* ── Partner's status ── */}
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

            {/* ── Comments ── */}
            {userId && <CommentsSection tmdbId={tmdbId} currentUserId={userId} />}

            {/* ── More Like This ── */}
            {(similarLoading || similarFilms.length > 0) && (
              <div className="mt-6 pt-5 border-t border-bg-border">
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">More Like This</p>
                <HScroll>
                  {similarLoading
                    ? Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex-none w-20 sm:w-[88px] animate-pulse">
                          <div className="aspect-[2/3] rounded-lg bg-bg-elevated" />
                          <div className="h-2 bg-bg-elevated rounded mt-2 w-3/4" />
                          <div className="h-2 bg-bg-elevated rounded mt-1.5 w-1/2" />
                        </div>
                      ))
                    : similarFilms.map(film => {
                        const poster = posterUrl(film.poster_path)
                        return (
                          <button
                            key={film.id}
                            onClick={() => onOpenFilm?.(film.id)}
                            className="flex-none w-20 sm:w-[88px] group text-left"
                            title={film.title}
                          >
                            <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-bg-elevated border border-transparent group-hover:border-cinema-red/40 transition-colors duration-200">
                              {poster
                                ? <Image src={poster} alt={film.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="88px" />
                                : <div className="w-full h-full flex items-center justify-center text-text-muted text-[10px]">No image</div>
                              }
                            </div>
                            <p className="text-[11px] leading-tight text-text-muted group-hover:text-text-secondary transition-colors mt-1.5 line-clamp-2">{film.title}</p>
                          </button>
                        )
                      })
                  }
                </HScroll>
              </div>
            )}

          </div>
        )}
      </div>
    </>
  )
}
