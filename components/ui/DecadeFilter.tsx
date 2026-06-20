'use client'

const DECADES = [
  { label: '70s', value: 1970 },
  { label: '80s', value: 1980 },
  { label: '90s', value: 1990 },
  { label: '00s', value: 2000 },
  { label: '10s', value: 2010 },
  { label: '20s', value: 2020 },
]

interface Props {
  selected: number | null
  onChange: (decade: number | null) => void
}

export default function DecadeFilter({ selected, onChange }: Props) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-text-muted">Decade:</span>
      {DECADES.map(({ label, value }) => (
        <button
          key={value}
          onClick={() => onChange(selected === value ? null : value)}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            selected === value
              ? 'bg-cinema-red text-white'
              : 'bg-bg-elevated text-text-secondary hover:text-white hover:bg-bg-card border border-bg-border'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
