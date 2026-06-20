import FilmCard from './FilmCard'
import type { TMDBMovie, FilmCardStatus } from '@/lib/types'

interface Props {
  movies: TMDBMovie[]
  statuses: Record<number, FilmCardStatus>
  onOpenDetail: (tmdbId: number) => void
}

export default function FilmGrid({ movies, statuses, onOpenDetail }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
      {movies.map(movie => (
        <FilmCard
          key={movie.id}
          movie={movie}
          initialStatus={statuses[movie.id] ?? { status: null, score: null }}
          onOpenDetail={onOpenDetail}
        />
      ))}
    </div>
  )
}
