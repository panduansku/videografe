import { useRef, type DragEvent, type ReactNode } from 'react'
import { useActive, useStore } from '../store'
import { ANGLES, LENS_SUGGESTIONS, MOVEMENTS, SHOT_SIZES, STATUS_LIST, STATUS_STYLE, ratioOf } from '../constants'
import { fmtDuration, shotLabel } from '../lib/project'
import { firstImageFile, setShotImage } from '../lib/image'
import type { Shot, ShotSize } from '../types'
import { Frame } from './Frame'
import { Icon } from './Icon'

function Field({ label, children, className = '' }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <span className="label">{label}</span>
      {children}
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-line px-4 py-4">
      <h3 className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-accent2">{title}</h3>
      <div className="space-y-3">{children}</div>
    </section>
  )
}

export function Inspector() {
  const project = useActive()
  const selectedId = useStore((s) => s.selectedId)
  const fileRef = useRef<HTMLInputElement>(null)
  const shot = project.shots.find((s) => s.id === selectedId)

  if (!shot) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center text-mute">
        <Icon name="film" size={28} />
        <p className="text-[13px]">Pilih sebuah shot di grid untuk mengedit detailnya.</p>
      </div>
    )
  }

  const st = useStore.getState
  const set = (patch: Partial<Shot>) => st().updateShot(shot.id, patch)
  const ratio = ratioOf(project.aspect)

  const onDrop = (e: DragEvent) => {
    const f = firstImageFile(e.dataTransfer.files)
    if (f) {
      e.preventDefault()
      void setShotImage(shot.id, f)
    }
  }

  const pasteFromClipboard = async () => {
    try {
      const items = await navigator.clipboard.read()
      for (const item of items) {
        const type = item.types.find((t) => t.startsWith('image/'))
        if (type) {
          await setShotImage(shot.id, await item.getType(type))
          return
        }
      }
      st().notify('Clipboard tidak berisi gambar.')
    } catch {
      st().notify('Tekan Ctrl+V / Cmd+V untuk menempel gambar.')
    }
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-panel">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div>
          <div className="font-mono text-[15px] font-bold text-accent">{shotLabel(shot)}</div>
          <div className="text-[11px] text-mute">
            {shot.size} · {shot.movement} · {fmtDuration(shot.duration)} · {project.fps}fps
          </div>
        </div>
        <div className="flex gap-0.5">
          <button className="btn-icon" title="Sisipkan shot setelah ini" onClick={() => st().addShot(shot.id)}>
            <Icon name="plus" />
          </button>
          <button className="btn-icon" title="Duplikat (Ctrl+D)" onClick={() => st().duplicateShot(shot.id)}>
            <Icon name="copy" />
          </button>
          <button
            className="btn-icon hover:!text-red-400"
            title="Hapus (Del)"
            onClick={() => window.confirm(`Hapus ${shotLabel(shot)}?`) && st().deleteShot(shot.id)}
          >
            <Icon name="trash" />
          </button>
        </div>
      </div>

      {/* Visual */}
      <div className="px-4 pb-4" onDragOver={(e) => e.preventDefault()} onDrop={onDrop}>
        <Frame ratio={ratio} image={shot.image} fit={shot.fit} strokes={shot.strokes} className="w-full rounded-md border border-line" />
        <div className="mt-2 flex flex-wrap gap-1.5">
          <button className="btn" onClick={() => fileRef.current?.click()}>
            <Icon name="image" size={14} /> Unggah
          </button>
          <button className="btn" onClick={pasteFromClipboard} title="Atau tekan Ctrl+V / Cmd+V">
            <Icon name="clipboard" size={14} /> Tempel
          </button>
          <button className="btn" onClick={() => st().setSketch(shot.id)}>
            <Icon name="pencil" size={14} /> Sketsa
          </button>
          {shot.image && (
            <>
              <button className="btn btn-ghost" onClick={() => set({ fit: shot.fit === 'cover' ? 'contain' : 'cover' })} title="Isi penuh frame / tampilkan utuh">
                {shot.fit === 'cover' ? 'Crop' : 'Fit'}
              </button>
              <button className="btn btn-ghost" onClick={() => set({ image: null })}>
                Hapus gambar
              </button>
            </>
          )}
          {shot.strokes.length > 0 && (
            <button className="btn btn-ghost" onClick={() => set({ strokes: [] })}>
              Hapus sketsa
            </button>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) void setShotImage(shot.id, f)
            e.target.value = ''
          }}
        />
      </div>

      <Section title="Identitas">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Scene">
            <input className="input font-mono" value={shot.scene} onChange={(e) => set({ scene: e.target.value })} spellCheck={false} />
          </Field>
          <Field label="Shot #">
            <input
              className="input font-mono disabled:opacity-60"
              value={shot.shot}
              disabled={project.autoNumber}
              onChange={(e) => set({ shot: e.target.value })}
              spellCheck={false}
            />
          </Field>
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-[12px] text-mute">
          <input
            type="checkbox"
            checked={project.autoNumber}
            onChange={(e) => st().updateProject({ autoNumber: e.target.checked })}
            className="accent-[#f2b04b]"
          />
          Penomoran shot otomatis per scene
        </label>
      </Section>

      <Section title="Status Syuting">
        <div className="flex flex-wrap gap-1">
          {STATUS_LIST.map((v) => (
            <button
              key={v}
              onClick={() => set({ status: v })}
              className={`rounded-md border px-2.5 py-1 text-[11px] font-semibold ${
                shot.status === v ? `border-transparent ${STATUS_STYLE[v].cls} ring-1 ring-current` : 'border-line bg-panel2 text-mute hover:text-text'
              }`}
            >
              {STATUS_STYLE[v].label}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Framing & Kamera">
        <Field label="Shot Size">
          <div className="flex flex-wrap gap-1">
            {SHOT_SIZES.map((s) => (
              <button
                key={s.value}
                title={s.label}
                onClick={() => set({ size: s.value as ShotSize })}
                className={`rounded-md border px-2 py-1 font-mono text-[11px] font-semibold ${
                  shot.size === s.value ? 'border-accent bg-accent/15 text-accent' : 'border-line bg-panel2 text-mute hover:text-text'
                }`}
              >
                {s.value}
              </button>
            ))}
          </div>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Camera Angle">
            <select className="input" value={shot.angle} onChange={(e) => set({ angle: e.target.value })}>
              {ANGLES.map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
          </Field>
          <Field label="Movement">
            <select className="input" value={shot.movement} onChange={(e) => set({ movement: e.target.value })}>
              {MOVEMENTS.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </Field>
        </div>
      </Section>

      <Section title="Teknis & Produksi">
        <div className="grid grid-cols-[1fr_96px] gap-3">
          <Field label="Lens / Catatan Kamera">
            <input className="input" list="lens-list" value={shot.lens} onChange={(e) => set({ lens: e.target.value })} spellCheck={false} />
            <datalist id="lens-list">
              {LENS_SUGGESTIONS.map((l) => (
                <option key={l} value={l} />
              ))}
            </datalist>
          </Field>
          <Field label="Durasi (dtk)">
            <input
              type="number"
              min={0}
              step={0.5}
              className="input font-mono"
              value={shot.duration}
              onChange={(e) => set({ duration: Math.max(0, parseFloat(e.target.value) || 0) })}
            />
          </Field>
        </div>
        <Field label="Lighting / Mood">
          <input className="input" value={shot.lighting} onChange={(e) => set({ lighting: e.target.value })} placeholder="mis. golden hour, soft key kiri" />
        </Field>
        <Field label="Audio / SFX / VO / Dialog">
          <textarea className="input min-h-[64px] resize-y" value={shot.audio} onChange={(e) => set({ audio: e.target.value })} placeholder="mis. VO: “Setiap pagi punya cerita.”" />
        </Field>
        <Field label="Catatan Visual / Blocking">
          <textarea className="input min-h-[72px] resize-y" value={shot.notes} onChange={(e) => set({ notes: e.target.value })} placeholder="Aksi, blocking, properti, referensi…" />
        </Field>
      </Section>

      <div className="mt-auto border-t border-line px-4 py-3 text-[10.5px] leading-relaxed text-mute">
        <span className="font-mono text-text/80">Ctrl+V</span> tempel gambar · <span className="font-mono text-text/80">N</span> shot baru ·{' '}
        <span className="font-mono text-text/80">Ctrl+D</span> duplikat · <span className="font-mono text-text/80">Del</span> hapus ·{' '}
        <span className="font-mono text-text/80">← →</span> pilih shot
      </div>
    </div>
  )
}
