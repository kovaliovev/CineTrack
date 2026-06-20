'use client'
import { useState } from 'react'

interface Props {
  value: number | null
  onChange: (score: number) => void
  onCancel?: () => void
}

function scoreColor(s: number) {
  if (s >= 8) return 'text-emerald-400'
  if (s >= 6) return 'text-yellow-400'
  return 'text-red-400'
}

const SCORES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

export default function RatingPicker({ value, onChange, onCancel }: Props) {
  const [hovered, setHovered] = useState<number | null>(null)
  const display = hovered ?? value

  return (
    <div className="select-none">
      <div className="flex items-baseline gap-2 mb-4">
        <span className={`text-3xl font-bold tabular-nums transition-all duration-100 ${display !== null ? scoreColor(display) : 'text-text-muted'}`}>
          {display ?? '—'}
        </span>
        <span className="text-xs text-text-muted">/ 10</span>
      </div>

      <div className="flex gap-1">
        {SCORES.map(s => {
          const active = value === s
          const isHovered = hovered === s
          return (
            <button
              key={s}
              onClick={() => onChange(s)}
              onMouseEnter={() => setHovered(s)}
              onMouseLeave={() => setHovered(null)}
              className={`flex-1 h-10 rounded text-sm font-semibold transition-all duration-100 active:scale-95 ${
                active || isHovered
                  ? 'bg-cinema-red text-white scale-105'
                  : 'bg-bg-base text-text-secondary hover:bg-bg-elevated hover:text-white'
              }`}
            >
              {s}
            </button>
          )
        })}
      </div>

      {onCancel && (
        <button
          onClick={onCancel}
          className="mt-3 text-xs text-text-muted hover:text-text-secondary transition-colors"
        >
          Cancel
        </button>
      )}
    </div>
  )
}
