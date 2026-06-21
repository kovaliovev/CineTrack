import type { FilmCardStatus } from '@/lib/types'

export function StatusDot({ filmStatus, label }: { filmStatus: FilmCardStatus['status']; label: string }) {
  if (filmStatus === 'watched')
    return <span className="text-[11px] leading-none text-emerald-400" title={`${label}: Watched`}>●</span>
  if (filmStatus === 'wishlist')
    return <span className="text-[11px] leading-none text-cinema-red" title={`${label}: Wishlisted`}>●</span>
  return <span className="text-[11px] leading-none text-text-muted" title={`${label}: Not seen`}>○</span>
}
