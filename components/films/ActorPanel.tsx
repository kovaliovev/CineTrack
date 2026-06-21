'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { posterUrl, profileUrl } from '@/lib/tmdb'
import { HScroll } from './HScroll'
import { StatusDot } from './StatusDot'
import type { PersonDetail, FilmCardStatus } from '@/lib/types'

interface Props {
  personId: number
  onBack: () => void
  onOpenFilm: (tmdbId: number) => void
  userId: string
}

export default function ActorPanel({ personId, onBack, onOpenFilm, userId }: Props) {
  const [person, setPerson] = useState<PersonDetail | null>(null)
  const [statuses, setStatuses] = useState<Record<number, FilmCardStatus>>({})
  const [error, setError] = useState(false)

  useEffect(() => {
    setPerson(null)
    setStatuses({})
    setError(false)
    let cancelled = false

    fetch(`/api/tmdb/person/${personId}`)
      .then(r => r.json())
      .then((data: PersonDetail) => {
        if (cancelled) return
        setPerson(data)
        if (!userId || !data.movie_credits.cast.length) return
        const ids = data.movie_credits.cast.map(f => f.id)
        createClient()
          .from('user_films')
          .select('tmdb_id, status, score')
          .eq('user_id', userId)
          .in('tmdb_id', ids)
          .then(({ data: ufData }) => {
            if (cancelled || !ufData) return
            const map: Record<number, FilmCardStatus> = {}
            ufData.forEach(uf => { map[uf.tmdb_id] = { status: uf.status, score: uf.score } })
            setStatuses(map)
          })
      })
      .catch(() => { if (!cancelled) setError(true) })

    return () => { cancelled = true }
  }, [personId, userId])

  const photo      = person ? profileUrl(person.profile_path) : null
  const initials   = person ? person.name.split(' ').map(n => n[0]).slice(0, 2).join('') : ''
  const birthYear  = person?.birthday?.slice(0, 4)
  const filmCount  = person?.movie_credits.cast.length ?? 0

  return (
    <div className="p-4 sm:p-6 pb-8">
      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-text-muted hover:text-white transition-colors mb-5"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Back
      </button>

      {error ? (
        <p className="text-sm text-text-muted py-8 text-center">Could not load actor details.</p>
      ) : !person ? (
        <div className="animate-pulse">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-14 h-14 rounded-full bg-bg-elevated flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-bg-elevated rounded w-1/2" />
              <div className="h-3 bg-bg-elevated rounded w-1/3" />
            </div>
          </div>
          <div className="flex gap-2.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex-none w-16">
                <div className="aspect-[2/3] rounded-lg bg-bg-elevated" />
                <div className="h-2 bg-bg-elevated rounded mt-2 w-3/4" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="flex items-center gap-3 mb-5">
            <div className="relative w-14 h-14 rounded-full overflow-hidden bg-bg-elevated flex-shrink-0">
              {photo
                ? <Image src={photo} alt={person.name} fill className="object-cover object-top" sizes="56px" />
                : <div className="w-full h-full flex items-center justify-center text-text-muted text-sm font-semibold">{initials}</div>
              }
            </div>
            <div>
              <h3 className="text-base font-bold text-text-primary leading-tight">{person.name}</h3>
              <p className="text-xs text-text-muted mt-0.5">
                {birthYear && <span>Born {birthYear}</span>}
                {birthYear && filmCount > 0 && <span className="mx-1">·</span>}
                {filmCount > 0 && <span>{filmCount} film{filmCount !== 1 ? 's' : ''}</span>}
              </p>
            </div>
          </div>

          {/* Filmography */}
          {person.movie_credits.cast.length > 0 && (
            <HScroll>
              {person.movie_credits.cast.map(film => {
                const poster      = posterUrl(film.poster_path)
                const year        = film.release_date?.slice(0, 4)
                const filmStatus  = statuses[film.id] ?? { status: null, score: null }
                return (
                  <button
                    key={film.id}
                    onClick={() => onOpenFilm(film.id)}
                    className="flex-none w-16 sm:w-[72px] text-center group"
                    title={film.title}
                  >
                    <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-bg-elevated border border-transparent group-hover:border-cinema-red/40 transition-colors">
                      {poster
                        ? <Image src={poster} alt={film.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="72px" />
                        : <div className="w-full h-full flex items-center justify-center text-text-muted text-[9px] p-1 text-center leading-tight">{film.title}</div>
                      }
                    </div>
                    <p className="text-[10px] font-medium text-text-primary truncate mt-1.5 leading-tight">{film.title}</p>
                    <p className="text-[10px] text-text-muted truncate leading-tight">
                      {year}{film.character ? ` · ${film.character}` : ''}
                    </p>
                    <div className="flex justify-center mt-1">
                      <StatusDot filmStatus={filmStatus.status} label="You" />
                    </div>
                  </button>
                )
              })}
            </HScroll>
          )}
        </>
      )}
    </div>
  )
}
