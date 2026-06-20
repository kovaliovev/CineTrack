export type FilmStatus = 'wishlist' | 'watched'

export interface Film {
  tmdb_id: number
  title: string
  poster_url: string | null
  year: number | null
  genres: string[]
  runtime: number | null
  overview: string | null
  director: string | null
}

export interface UserFilm {
  id: string
  user_id: string
  tmdb_id: number
  status: FilmStatus
  score: number | null
  added_at: string
}

export interface Profile {
  id: string
  display_name: string | null
  couple_id: string | null
}

export interface Couple {
  id: string
  invite_code: string
  user1_id: string | null
  user2_id: string | null
}

export interface Comment {
  id: string
  tmdb_id: number
  user_id: string
  body: string
  created_at: string
  updated_at: string | null
}

export interface TMDBMovie {
  id: number
  title: string
  poster_path: string | null
  release_date: string
  genre_ids: number[]
  overview: string
  vote_average?: number
}

export interface CastMember {
  id: number
  name: string
  character: string
  profile_path: string | null
  order: number
}

export interface TMDBCollection {
  id: number
  name: string
  parts: TMDBMovie[]
}

export interface TMDBMovieDetail {
  id: number
  title: string
  poster_path: string | null
  release_date: string
  runtime: number | null
  overview: string
  genres: { id: number; name: string }[]
  belongs_to_collection: { id: number; name: string; poster_path: string | null } | null
  credits: {
    crew: { job: string; name: string }[]
    cast: CastMember[]
  }
  videos: { results: { type: string; site: string; key: string; official: boolean }[] }
}

export interface TMDBGenre {
  id: number
  name: string
}

// What the card needs about the current user's relationship to a film
export interface FilmCardStatus {
  status: FilmStatus | null
  score: number | null
}
