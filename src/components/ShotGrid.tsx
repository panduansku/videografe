import { useCallback, useMemo, useRef, useState, type DragEvent } from 'react'
import { useActive, useStore } from '../store'
import { STATUS_LIST, STATUS_STYLE, ratioOf } from '../constants'
import { shotLabel } from '../lib/project'
import type { ShotStatus } from '../types'
import { firstImageFile, setShotImage } from '../lib/image'
import { ShotCard } from './ShotCard'
import { Icon } from './Icon'

export function ShotGrid() {
  const project = useActive()
  const selectedId = useStore((s) => s.selectedId)
  const cardSize = useStore((s) => s.cardSize)
  const setCardSize = useStore((s) => s.setCardSize)

  const [dragId, setDragId] = useState<string | null>(null)
  const [drop, setDrop] = useState<{ id: string; after: boolean } | null>(null)
  const dropRef = useRef<{ id: string; after: boolean } | null>(null)
  const dragRef = useRef<string | null>(null)

  const ratio = ratioOf(project.aspect)

  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | ShotStatus>('all')
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return project.shots.filter((s) => {
      if (statusFilter !== 'all' && s.status !== statusFilter) return false
      if (!q) return true
      return [shotLabel(s), s.size, s.angle, s.movement, s.lens, s.lighting, s.audio, s.notes].join(' ').toLowerCase().includes(q)
    })
  }, [project.shots, query, statusFilter])
  const filtering = query.trim() !== '' || statusFilter !== 'all'

  const onDragStart = useCallback((id: string) => {
    dragRef.current = id
    setDragId(id)
  }, [])

  const onDragOver = useCallback((id: string, after: boolean) => {
    const cur = dropRef.current
    if (cur && cur.id === id && cur.after === after) return
    dropRef.current = { id, after }
    setDrop({ id, after })
  }, [])

  const reset = useCallback(() => {
    dragRef.current = null
    dropRef.current = null
    setDragId(null)
    setDrop(null)
  }, [])

  const onDrop = useCallback(
    (targetId: string, e: DragEvent) => {
      // 1) File gambar dari luar aplikasi -> jadikan frame shot tujuan
      const img = firstImageFile(e.dataTransfer.files)
      if (img && !dragRef.current) {
        useStore.getState().select(targetId)
        void setShotImage(targetId, img)
      } else if (dragRef.current && dropRef.current) {
        // 2) Reorder kartu
        useStore.getState().moveShot(dragRef.current, targetId, dropRef.current.after)
      }
      reset()
    },
    [reset],
  )

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-line px-5">
        <div className="flex items-center gap-2 text-[12px] text-mute">
          <span className="font-semibold uppercase tracking-[0.12em] text-text">Storyboard</span>
          <span className="font-mono">{filtering ? `· ${visible.length}/${project.shots.length} shot` : '· seret kartu · klik ganda untuk sketsa'}</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            className="input !w-52 !py-1"
            placeholder="Cari scene, catatan, lensa…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            spellCheck={false}
          />
          <select className="input !w-auto !py-1" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as 'all' | ShotStatus)}>
            <option value="all">Semua status</option>
            {STATUS_LIST.map((v) => (
              <option key={v} value={v}>
                {STATUS_STYLE[v].label}
              </option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 text-[11px] text-mute">
          Ukuran kartu
          <input
            type="range"
            min={200}
            max={460}
            step={10}
            value={cardSize}
            onChange={(e) => setCardSize(Number(e.target.value))}
            className="w-28 accent-[#f2b04b]"
          />
        </label>
      </div>

      <div className="flex-1 overflow-y-auto p-5" onClick={(e) => e.target === e.currentTarget && useStore.getState().select(null)}>
        <div className="grid items-start gap-4" style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${cardSize}px, 1fr))` }}>
          {visible.map((s) => (
            <ShotCard
              key={s.id}
              shot={s}
              ratio={ratio}
              selected={s.id === selectedId}
              dragging={s.id === dragId}
              dropSide={drop && drop.id === s.id && dragId && dragId !== s.id ? (drop.after ? 'after' : 'before') : null}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDrop={onDrop}
              onDragEnd={reset}
            />
          ))}

          <button
            onClick={() => useStore.getState().addShot(project.shots[project.shots.length - 1]?.id ?? null)}
            className="flex min-h-[140px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-line text-mute transition-colors hover:border-accent/60 hover:text-accent"
            style={{ aspectRatio: ratio < 1 ? undefined : String(ratio) }}
          >
            <Icon name="plus" size={22} />
            <span className="text-[12px]">Tambah shot</span>
          </button>
        </div>
      </div>
    </div>
  )
}
