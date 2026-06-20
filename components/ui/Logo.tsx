interface Props {
  wordmark?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

// Double film reel icon — two reels side by side (ReelTwo concept)
// viewBox 0 0 44 24: left reel cx=11 cy=12 r=9, right reel cx=33 cy=12 r=9, 4px gap between
function ReelIcon({ scale }: { scale: number }) {
  const w = Math.round(44 * scale)
  const h = Math.round(24 * scale)
  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 44 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Left reel */}
      <circle cx="11" cy="12" r="9" stroke="#e50914" strokeWidth="1.5"/>
      <circle cx="11" cy="12" r="3" fill="#e50914"/>
      {/* Left sprocket marks — top, bottom, outer-left */}
      <circle cx="11" cy="2.2" r="1.3" fill="#e50914"/>
      <circle cx="11" cy="21.8" r="1.3" fill="#e50914"/>
      <circle cx="1.3"  cy="12"  r="1.3" fill="#e50914"/>

      {/* Right reel */}
      <circle cx="33" cy="12" r="9" stroke="#e50914" strokeWidth="1.5"/>
      <circle cx="33" cy="12" r="3" fill="#e50914"/>
      {/* Right sprocket marks — top, bottom, outer-right */}
      <circle cx="33" cy="2.2"  r="1.3" fill="#e50914"/>
      <circle cx="33" cy="21.8" r="1.3" fill="#e50914"/>
      <circle cx="42.7" cy="12" r="1.3" fill="#e50914"/>
    </svg>
  )
}

const SCALES = { sm: 0.72, md: 1, lg: 1.5 }

export default function Logo({ wordmark = false, size = 'md', className }: Props) {
  const scale = SCALES[size]

  const textSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-3xl',
  }

  return (
    <div className={`flex items-center gap-2.5 ${className ?? ''}`}>
      <ReelIcon scale={scale} />
      {wordmark && (
        <span className={`${textSizes[size]} leading-none`}>
          <span className="font-light text-white">Reel</span>
          <span className="font-bold text-cinema-red">Two</span>
        </span>
      )}
    </div>
  )
}
