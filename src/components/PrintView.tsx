import { useActive, useStore } from '../store'
import { PRINT_LAYOUTS, ratioOf } from '../constants'
import { fmtDuration, projectStats, shotLabel } from '../lib/project'
import { Frame } from './Frame'

/** Tata letak khusus cetak/PDF (tema terang, hemat tinta). Tersembunyi di layar, tampil hanya saat print. */
export function PrintView() {
  const project = useActive()
  const layout = PRINT_LAYOUTS[useStore((s) => s.printLayout)]
  const ratio = ratioOf(project.aspect)
  const stats = projectStats(project)
  const portrait = ratio < 1

  return (
    <div id="print-root" className="bg-white font-sans text-black">
      <style>{`@page { size: A4 ${layout.orient}; margin: 10mm; }`}</style>

      <div className="mb-4 flex items-end justify-between border-b-2 border-black pb-2">
        <div>
          <div className="text-[18pt] font-bold leading-tight">{project.name}</div>
          <div className="text-[9pt] text-neutral-600">
            Storyboard · {project.aspect} · {project.fps} fps · Lensa default {project.defaultLens || '-'}
          </div>
        </div>
        <div className="text-right text-[9pt] text-neutral-600">
          <div>
            {stats.shots} shot · {stats.scenes} scene · {fmtDuration(stats.duration)}
          </div>
          <div>{new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
        </div>
      </div>

      <div className="grid gap-x-4 gap-y-5" style={{ gridTemplateColumns: `repeat(${layout.cols}, minmax(0, 1fr))` }}>
        {project.shots.map((s) => (
          <div key={s.id} className="break-inside-avoid" style={{ breakInside: 'avoid' }}>
            <div className="mb-1 flex items-baseline justify-between">
              <span className="font-mono text-[10pt] font-bold">{shotLabel(s)}</span>
              <span className="font-mono text-[9pt] text-neutral-600">{fmtDuration(s.duration)}</span>
            </div>

            {portrait ? (
              <div className="flex justify-center border border-black bg-neutral-100" style={{ height: layout.portraitH }}>
                <Frame ratio={ratio} image={s.image} fit={s.fit} strokes={s.strokes} print className="h-full" style={{ width: 'auto' }} />
              </div>
            ) : (
              <Frame ratio={ratio} image={s.image} fit={s.fit} strokes={s.strokes} print className="w-full border border-black" />
            )}

            <div className="mt-1 flex flex-wrap gap-1 text-[8pt] font-semibold">
              {[s.size, s.movement, s.angle, s.lens].filter(Boolean).map((t, i) => (
                <span key={i} className="rounded-sm border border-neutral-500 px-1 py-px">
                  {t}
                </span>
              ))}
            </div>
            <div className="mt-1 space-y-0.5 text-[8.5pt] leading-snug">
              {s.notes && <p>{s.notes}</p>}
              {s.lighting && (
                <p>
                  <b>Light:</b> {s.lighting}
                </p>
              )}
              {s.audio && (
                <p>
                  <b>Audio:</b> {s.audio}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
