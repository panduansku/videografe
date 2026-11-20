import { memo, type DragEvent } from 'react'
import type { Shot } from '../types'
import { fmtDuration, shotLabel } from '../lib/project'
import { useStore } from '../store'
import { Frame } from './Frame'
import { Icon } from './Icon'

interface Props {
  shot: Shot
  ratio: number
  selected: boolean
  dragging: boolean
  dropSide: 'before' | 'after' | null
  onDragStart: (id: string) => void
  onDragOver: (id: string, after: boolean) => void
  onDrop: (id: string, e: DragEvent) => void
  onDragEnd: () => void
}

function confirmDelete(shot: Shot): boolean {
  const hasContent = shot.image || shot.notes || shot.audio || shot.strokes.length
  return !hasContent || window.confirm(`Hapus ${shotLabel(shot)}?`)
}

export const ShotCard = memo(function ShotCard({ shot, ratio, selected, dragging, dropSide, onDragStart, onDragOver, onDrop, onDragEnd }: Props) {
  const st = useStore.getState
  const portrait = ratio < 1

  const frame = (
    <Frame
      ratio={ratio}
      image={shot.image}
      fit={shot.fit}
      strokes={shot.strokes}
      className={portrait ? 'h-full' : 'w-full'}
      style={portrait ? { width: 'auto' } : undefined}
    >
      <span className="absolute left-2 top-2 rounded bg-black/65 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-accent">{shotLabel(shot)}</span>
      <span className="absolute bottom-2 right-2 rounded bg-black/65 px-1.5 py-0.5 font-mono text-[11px] text-text">{fmtDuration(shot.duration)}</span>

      <div className="absolute right-1.5 top-1.5 flex gap-0.5 rounded-md bg-black/70 p-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        <button className="btn-icon !h-6 !w-6" title="Sisipkan shot setelah ini" onClick={(e) => { e.stopPropagation(); st().addShot(shot.id) }}>
          <Icon name="plus" size={14} />
        </button>
        <button className="btn-icon !h-6 !w-6" title="Sketsa / anotasi" onClick={(e) => { e.stopPropagation(); st().select(shot.id); st().setSketch(shot.id) }}>
          <Icon name="pencil" size={14} />
        </button>
        <button className="btn-icon !h-6 !w-6" title="Duplikat (Ctrl+D)" onClick={(e) => { e.stopPropagation(); st().duplicateShot(shot.id) }}>
          <Icon name="copy" size={14} />
        </button>
        <button className="btn-icon !h-6 !w-6 hover:!text-red-400" title="Hapus" onClick={(e) => { e.stopPropagation(); if (confirmDelete(shot)) st().deleteShot(shot.id) }}>
          <Icon name="trash" size={14} />
        </button>
      </div>
    </Frame>
  )

  return (
    <div
      draggable
      onClick={() => st().select(shot.id)}
      onDoubleClick={() => st().setSketch(shot.id)}
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', shot.id)
        e.dataTransfer.effectAllowed = 'move'
        onDragStart(shot.id)
      }}
      onDragOver={(e) => {
        e.preventDefault()
        const r = e.currentTarget.getBoundingClientRect()
        onDragOver(shot.id, e.clientX > r.left + r.width / 2)
      }}
      onDrop={(e) => {
        e.preventDefault()
        onDrop(shot.id, e)
      }}
      onDragEnd={onDragEnd}
      className={`group relative flex cursor-pointer flex-col overflow-hidden rounded-lg border bg-panel transition-colors ${
        selected ? 'border-accent ring-1 ring-accent/60' : 'border-line hover:border-[#3b424c]'
      } ${dragging ? 'opacity-40' : ''}`}
    >
      {dropSide && (
        <span className={`pointer-events-none absolute bottom-0 top-0 z-10 w-[3px] bg-accent2 ${dropSide === 'before' ? 'left-0' : 'right-0'}`} />
      )}

      {portrait ? <div className="flex h-[300px] justify-center bg-[#0c0e10]">{frame}</div> : frame}

      <div className="flex flex-1 flex-col gap-1.5 p-2.5">
        <div className="flex flex-wrap items-center gap-1">
          <span className="chip chip-accent">{shot.size}</span>
          <span className="chip chip-cyan">{shot.movement}</span>
          <span className="chip chip-mute">{shot.angle}</span>
          {shot.lens && <span className="chip chip-mute ml-auto">{shot.lens}</span>}
        </div>
        {shot.notes && <p className="line-clamp-2 text-[12px] leading-snug text-text/90">{shot.notes}</p>}
        {shot.audio && (
          <p className="line-clamp-1 text-[11.5px] leading-snug text-mute">
            <span className="text-accent2">♪</span> {shot.audio}
          </p>
        )}
      </div>
    </div>
  )
})
