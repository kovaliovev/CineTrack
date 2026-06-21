export function HScroll({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      <div className="absolute right-0 top-0 bottom-2 w-10 bg-gradient-to-l from-bg-card to-transparent z-10 pointer-events-none" />
      <div
        className="flex gap-2.5 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: 'none' }}
      >
        {children}
      </div>
    </div>
  )
}
