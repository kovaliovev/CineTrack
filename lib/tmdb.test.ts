// lib/tmdb.test.ts
import { describe, it, expect } from 'vitest'
import { posterUrl, trailerKey } from './tmdb'
import type { TMDBMovieDetail } from './types'

describe('posterUrl', () => {
  it('returns full URL for a poster path', () => {
    expect(posterUrl('/abc.jpg')).toBe('https://image.tmdb.org/t/p/w500/abc.jpg')
  })
  it('returns null when path is null', () => {
    expect(posterUrl(null)).toBeNull()
  })
})

describe('trailerKey', () => {
  const base: TMDBMovieDetail = {
    id: 1, title: 'Test', poster_path: null, release_date: '2020-01-01',
    runtime: 100, overview: '', genres: [], belongs_to_collection: null,
    credits: { crew: [], cast: [] }, videos: { results: [] }
  }

  it('returns YouTube key for official trailer', () => {
    const detail: TMDBMovieDetail = {
      ...base,
      videos: { results: [
        { type: 'Teaser', site: 'YouTube', key: 'teaser1', official: false },
        { type: 'Trailer', site: 'YouTube', key: 'trailer1', official: true },
      ]}
    }
    expect(trailerKey(detail)).toBe('trailer1')
  })

  it('returns null when no YouTube trailer exists', () => {
    expect(trailerKey(base)).toBeNull()
  })
})
