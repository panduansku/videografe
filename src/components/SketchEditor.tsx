import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { useActive, useStore } from '../store'
import { SKETCH_COLORS, SKETCH_WIDTHS, ratioOf } from '../constants'
import { shotLabel, uid } from '../lib/project'
import type { Shot, Stroke, Tool } from '../types'
import { Frame } from './Frame'
import { Icon, type IconName } from './Icon'

const TOOLS: { id: Tool; label: string; icon: IconName }[] = [
  { id: 'pen', label: 'Coretan', icon: 'pencil' },
  { id: 'line', label: 'Garis', icon: 'line' },
  { id: 'arrow', label: 'Panah', icon: 'arrow' },
]

const clamp = (v: number) => Math.min(1, Math.max(0, v))

export function SketchEditor() {
  const sketchId = useStore((s) => s.sketchId)
  const project = useActive()
  const shot = project.shots.find((s) => s.id === sketchId)
  if (!sketchId || !shot) return null
  return <Editor key={shot.id} shot={shot} ratio={ratioOf(project.aspect)} />
}

function Editor({ shot, ratio }: { shot: Shot; ratio: number }) {
  const [strokes, setStrokes] = useState<Stroke[]>(shot.strokes)
  const [draft, setDraft] = useState<Stroke | null>(null)
  const [tool, setTool] = useState<Tool>('arrow')
  const [color, setColor] = useState(SKETCH_COLORS[0])
  const [width, setWidth] = useState(8)
  const [guides, setGuides] = useState(true)
  const boxRef = useRef<HTMLDivElement>(null)

  const close = () => useStore.getState().setSketch(null)
  const save = () => {
    useStore.getState().updateShot(shot.id, { strokes })
    close()
  }
  const undo = () => setStrokes((s) => s.slice(0, -1))

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        undo()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toNorm = (e: PointerEvent): [number, number] => {
    const r = boxRef.current!.getBoundingClientRect()
    return [clamp((e.clientX - r.left) / r.width), clamp((e.clientY - r.top) / r.height)]
  }

  const down = (e: PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    const p = toNorm(e)
    setDraft({ id: uid(), tool, color, width, pts: tool === 'pen' ? [p] : [p, p] })
  }

  const move = (e: PointerEvent) => {
    if (!draft) return
    const p = toNorm(e)
    if (draft.tool === 'pen') {
      const last = draft.pts[draft.pts.length - 1]
      if (Math.hypot(p[0] - last[0], p[1] - last[1]) < 0.003) return
      setDraft({ ...draft, pts: [...draft.pts, p] })
    } else {
      setDraft({ ...draft, pts: [draft.pts[0], p] })
    }
  }

  const up = () => {
    if (!draft) return
    const [a, b] = [draft.pts[0], draft.pts[draft.pts.length - 1]]
    const tiny = draft.tool !== 'pen' && Math.hypot(a[0] - b[0], a[1] - b[1]) < 0.01
    if (!tiny) setStrokes((s) => [...s, draft])
    setDraft(null)
  }

  const frameW = `min(90vw, calc((100vh - 220px) * ${ratio}))`

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 bg-black/80 p-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-line bg-panel px-3 py-2 shadow-2xl">
        <span className="font-mono text-[12px] font-bold text-accent">{shotLabel(shot)}</span>
        <div className="h-5 w-px bg-line" />
        <div className="flex gap-1">
          {TOOLS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTool(t.id)}
              className={`btn !px-2 ${tool === t.id ? '!border-accent !text-accent' : ''}`}
              title={t.label}
            >
              <Icon name={t.icon} size={15} /> {t.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          {SKETCH_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`h-5 w-5 rounded-full border-2 ${color === c ? 'border-white' : 'border-transparent'}`}
              style={{ background: c }}
              aria-label={`Warna ${c}`}
            />
          ))}
        </div>
        <div className="flex gap-1">
          {SKETCH_WIDTHS.map((w) => (
            <button key={w.label} onClick={() => setWidth(w.value)} className={`btn !px-2 font-mono ${width === w.value ? '!border-accent !text-accent' : ''}`}>
              {w.label}
            </button>
          ))}
        </div>
        <button className={`btn ${guides ? '!border-accent2 !text-accent2' : ''}`} onClick={() => setGuides((g) => !g)} title="Garis bantu rule of thirds">
          <Icon name="grid" size={15} /> Guide
        </button>
        <div className="h-5 w-px bg-line" />
        <button className="btn" onClick={undo} disabled={!strokes.length} title="Urungkan (Ctrl+Z)">
          <Icon name="undo" size={15} /> Undo
        </button>
        <button className="btn" onClick={() => setStrokes([])} disabled={!strokes.length}>
          Bersihkan
        </button>
        <div className="h-5 w-px bg-line" />
        <button className="btn btn-ghost" onClick={close}>
          Batal
        </button>
        <button className="btn btn-primary" onClick={save}>
          <Icon name="check" size={15} /> Selesai
        </button>
      </div>

      {/* Kanvas */}
      <div ref={boxRef} className="relative shadow-2xl shadow-black" style={{ width: frameW }}>
        <Frame ratio={ratio} image={shot.image} fit={shot.fit} strokes={draft ? [...strokes, draft] : strokes} className="w-full rounded-sm ring-1 ring-line">
          {guides && (
            <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 3 3" preserveAspectRatio="none" aria-hidden>
              <path d="M1 0V3M2 0V3M0 1H3M0 2H3" stroke="#fff" strokeOpacity="0.28" strokeWidth="1" vectorEffect="non-scaling-stroke" fill="none" />
            </svg>
          )}
          <div className="absolute inset-0 cursor-crosshair touch-none" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} />
        </Frame>
      </div>

      <p className="text-[11px] text-mute">Gambar panah gerak kamera/subjek di atas frame · Esc untuk batal · Ctrl+Z untuk urungkan</p>
    </div>
  )
}
