import { useCallback, useRef, useState, type DragEvent } from 'react'
import { useActive, useStore } from '../store'
import { ratioOf } from '../constants'
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
          <span className="font-mono">· seret kartu untuk mengurutkan · klik ganda untuk sketsa</span>
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
          {project.shots.map((s, i) => (
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
