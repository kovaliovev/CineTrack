'use client'
import { scoreSteps, formatScore } from '@/lib/utils'

interface Props {
  value: number | null
  onChange: (score: number) => void
  onCancel?: () => void
}

export default function RatingPicker({ value, onChange, onCancel }: Props) {
  return (
    <div className="bg-bg-elevated border border-bg-border rounded-xl p-4 shadow-xl">
      <p className="text-sm text-text-secondary mb-3">Rate this film</p>
      <div className="flex flex-wrap gap-1.5 max-w-xs">
        {scoreSteps.map(step => (
          <button
            key={step}
            onClick={() => onChange(step)}
            className={`w-10 h-8 rounded text-xs font-semibold transition-colors ${
              value === step
                ? 'bg-cinema-red text-white'
                : 'bg-bg-base text-text-secondary hover:bg-cinema-red hover:text-white'
            }`}
          >
            {formatScore(step)}
          </button>
        ))}
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
