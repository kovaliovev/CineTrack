interface Props {
  wordmark?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

// Two overlapping filled circles — same visual language as the Couple nav icon
// viewBox 0 0 22 18: mirrors the sidebar Couple icon (cx=6/12, r=5) scaled up
function ReelIcon({ scale }: { scale: number }) {
  const w = Math.round(22 * scale)
  const h = Math.round(18 * scale)
  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 22 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="8"  cy="9" r="7" fill="#e50914" opacity="0.9"/>
      <circle cx="14" cy="9" r="7" fill="#e50914" opacity="0.5"/>
    </svg>
  )
}

const SCALES = { sm: 1, md: 1.5, lg: 2 }

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
