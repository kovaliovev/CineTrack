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

const INTEGERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
const HALVES   = [0.5, 1.5, 2.5, 3.5, 4.5, 5.5, 6.5, 7.5, 8.5, 9.5]

export default function RatingPicker({ value, onChange, onCancel }: Props) {
  const [hovered, setHovered] = useState<number | null>(null)
  const display = hovered ?? value

  return (
    <div className="select-none">
      {/* Score display */}
      <div className="flex items-baseline gap-2 mb-4">
        <span className={`text-3xl font-bold tabular-nums transition-all duration-100 ${display !== null ? scoreColor(display) : 'text-text-muted'}`}>
          {display !== null ? display.toFixed(1) : '—'}
        </span>
        <span className="text-xs text-text-muted">/ 10</span>
      </div>

      {/* Half-step row */}
      <div className="flex gap-1 mb-1">
        {HALVES.map(s => {
          const active = value === s
          const isHovered = hovered === s
          return (
            <button
              key={s}
              onClick={() => onChange(s)}
              onMouseEnter={() => setHovered(s)}
              onMouseLeave={() => setHovered(null)}
              className={`flex-1 h-5 rounded text-[9px] font-medium transition-all duration-100 active:scale-95 ${
                active || isHovered
                  ? 'bg-cinema-red text-white'
                  : 'bg-bg-base text-text-muted hover:bg-bg-elevated'
              }`}
            >
              .5
            </button>
          )
        })}
      </div>

      {/* Integer row */}
      <div className="flex gap-1">
        {INTEGERS.map(s => {
          const active = value === s
          const isHovered = hovered === s
          return (
            <button
              key={s}
              onClick={() => onChange(s)}
              onMouseEnter={() => setHovered(s)}
              onMouseLeave={() => setHovered(null)}
              className={`flex-1 h-9 rounded text-sm font-semibold transition-all duration-100 active:scale-95 ${
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
