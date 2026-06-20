// components/films/TrailerButton.tsx
'use client'
import { useState } from 'react'

export default function TrailerButton({ trailerKey }: { trailerKey: string }) {
  const [open, setOpen] = useState(false)

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-sm text-text-secondary hover:text-white transition-colors"
      >
        <span className="w-7 h-7 rounded-full bg-cinema-red flex items-center justify-center flex-shrink-0">
          <svg width="10" height="12" viewBox="0 0 10 12" fill="white" aria-hidden="true">
            <path d="M0 0L10 6L0 12V0Z"/>
          </svg>
        </span>
        Watch Trailer
      </button>
    )
  }

  return (
    <div className="aspect-video w-full max-w-lg rounded-lg overflow-hidden">
      <iframe
        src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1`}
        allow="autoplay; encrypted-media"
        allowFullScreen
        className="w-full h-full"
        title="Trailer"
      />
    </div>
  )
}
