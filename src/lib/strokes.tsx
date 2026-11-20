import type { Stroke } from '../types'

export const VB_W = 1000
const f = (n: number) => Math.round(n * 10) / 10

export function strokePath(s: Stroke, W: number, H: number): string {
  const P = s.pts.map(([x, y]) => [x * W, y * H] as [number, number])
  if (!P.length) return ''
  if (s.tool === 'pen') {
    if (P.length === 1) return `M${f(P[0][0])} ${f(P[0][1])}h0.01`
    return P.map(([x, y], i) => `${i ? 'L' : 'M'}${f(x)} ${f(y)}`).join(' ')
  }
  const a = P[0]
  const b = P[P.length - 1]
  let d = `M${f(a[0])} ${f(a[1])} L${f(b[0])} ${f(b[1])}`
  if (s.tool === 'arrow') {
    const ang = Math.atan2(b[1] - a[1], b[0] - a[0])
    const L = 14 + s.width * 3.2
    const sp = 0.5
    const p1 = [b[0] - L * Math.cos(ang - sp), b[1] - L * Math.sin(ang - sp)]
    const p2 = [b[0] - L * Math.cos(ang + sp), b[1] - L * Math.sin(ang + sp)]
    d += ` M${f(p1[0])} ${f(p1[1])} L${f(b[0])} ${f(b[1])} L${f(p2[0])} ${f(p2[1])}`
  }
  return d
}

/** Lapisan anotasi vektor (SVG) di atas frame. Ringan, tajam saat dicetak, dan tersimpan sebagai JSON kecil. */
export function StrokesLayer({ strokes, ratio }: { strokes: Stroke[]; ratio: number }) {
  const H = VB_W / ratio
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox={`0 0 ${VB_W} ${H}`}
      preserveAspectRatio="none"
      aria-hidden
    >
      {strokes.map((s) => (
        <path
          key={s.id}
          d={strokePath(s, VB_W, H)}
          fill="none"
          stroke={s.color}
          strokeWidth={s.width}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  )
}
