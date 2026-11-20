import { useEffect, useRef, useState, type ReactNode } from 'react'

interface Props {
  trigger: (open: boolean) => ReactNode
  children: (close: () => void) => ReactNode
  align?: 'left' | 'right'
  width?: string
}

/** Dropdown ringan: tertutup saat klik di luar atau menekan Esc. */
export function Popover({ trigger, children, align = 'left', width = 'w-64' }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <div onClick={() => setOpen((o) => !o)}>{trigger(open)}</div>
      {open && (
        <div
          className={`absolute z-50 mt-2 ${width} ${align === 'right' ? 'right-0' : 'left-0'} rounded-lg border border-line bg-panel p-1.5 shadow-2xl shadow-black/50`}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  )
}

export function MenuItem({
  onClick,
  children,
  danger = false,
  active = false,
}: {
  onClick: () => void
  children: ReactNode
  danger?: boolean
  active?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[13px] hover:bg-white/5 ${
        danger ? 'text-red-400' : active ? 'text-accent' : 'text-text'
      }`}
    >
      {children}
    </button>
  )
}
