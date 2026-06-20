// lib/tmdb.ts
import type { TMDBMovie, TMDBMovieDetail, TMDBGenre } from './types'

const BASE = 'https://api.themoviedb.org/3'
const key = () => process.env.TMDB_API_KEY!

function get<T>(path: string, params: Record<string, string> = {}, cache: RequestInit['cache'] | { revalidate: number } = { revalidate: 3600 }): Promise<T> {
  const url = new URL(BASE + path)
  url.searchParams.set('api_key', key())
  url.searchParams.set('language', 'en-US')
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  const init = typeof cache === 'string' ? { cache } : { next: cache }
  return fetch(url.toString(), init as RequestInit).then(r => r.json())
}

export function posterUrl(path: string | null): string | null {
  return path ? `https://image.tmdb.org/t/p/w500${path}` : null
}

export function trailerKey(detail: TMDBMovieDetail): string | null {
  const trailer = detail.videos.results.find(
    v => v.type === 'Trailer' && v.site === 'YouTube'
  )
  return trailer?.key ?? null
}

export function directorName(detail: TMDBMovieDetail): string | null {
  return detail.credits.crew.find(c => c.job === 'Director')?.name ?? null
}

export async function fetchTrending(): Promise<TMDBMovie[]> {
  const data = await get<{ results: TMDBMovie[] }>('/trending/movie/week')
  return data.results
}

export async function fetchTopRated(page = 1): Promise<TMDBMovie[]> {
  const data = await get<{ results: TMDBMovie[] }>('/movie/top_rated', { page: String(page) })
  return data.results
}

export async function fetchByGenre(genreId: number): Promise<TMDBMovie[]> {
  const data = await get<{ results: TMDBMovie[] }>('/discover/movie', {
    with_genres: String(genreId),
    sort_by: 'popularity.desc',
  })
  return data.results
}

export async function fetchSearch(query: string): Promise<TMDBMovie[]> {
  if (!query.trim()) return []
  const data = await get<{ results: TMDBMovie[] }>('/search/movie', { query }, 'no-store')
  return data.results
}

export async function fetchFilmDetail(id: number): Promise<TMDBMovieDetail> {
  return get<TMDBMovieDetail>(`/movie/${id}`, {
    append_to_response: 'credits,videos',
  })
}

export async function fetchGenres(): Promise<TMDBGenre[]> {
  const data = await get<{ genres: TMDBGenre[] }>('/genre/movie/list')
  return data.genres
}

export async function fetchNowPlaying(): Promise<TMDBMovie[]> {
  const data = await get<{ results: TMDBMovie[] }>('/movie/now_playing')
  return data.results
}

export async function fetchUpcoming(): Promise<TMDBMovie[]> {
  const data = await get<{ results: TMDBMovie[] }>('/movie/upcoming')
  return data.results
}

export async function fetchPopular(): Promise<TMDBMovie[]> {
  const data = await get<{ results: TMDBMovie[] }>('/movie/popular')
  return data.results
}

export async function fetchAcclaimed(): Promise<TMDBMovie[]> {
  const data = await get<{ results: TMDBMovie[] }>('/discover/movie', {
    sort_by: 'vote_average.desc',
    'vote_count.gte': '1000',
  })
  return data.results
}

export async function fetchByDecade(decade: number): Promise<TMDBMovie[]> {
  const data = await get<{ results: TMDBMovie[] }>('/discover/movie', {
    'primary_release_date.gte': `${decade}-01-01`,
    'primary_release_date.lte': `${decade + 9}-12-31`,
    sort_by: 'popularity.desc',
  })
  return data.results
}
