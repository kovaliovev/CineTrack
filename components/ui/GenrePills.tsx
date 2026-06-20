'use client'
interface Genre { id: number; name: string }
interface Props {
  genres: Genre[]
  selected: number | null
  onSelect: (id: number | null) => void
}

export default function GenrePills({ genres, selected, onSelect }: Props) {
  return (
    <div className="flex gap-2 flex-wrap">
      <button
        onClick={() => onSelect(null)}
        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
          selected === null
            ? 'bg-cinema-red text-white'
            : 'bg-bg-elevated text-text-secondary hover:text-white'
        }`}
      >
        All
      </button>
      {genres.map(g => (
        <button
          key={g.id}
          onClick={() => onSelect(g.id)}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            selected === g.id
              ? 'bg-cinema-red text-white'
              : 'bg-bg-elevated text-text-secondary hover:text-white'
          }`}
        >
          {g.name}
        </button>
      ))}
    </div>
  )
}
