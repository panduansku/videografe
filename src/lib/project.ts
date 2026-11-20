import type { AspectRatio, Project, Shot, ShotSize, ShotStatus, Stroke } from '../types'
import { ASPECTS, SHOT_SIZES, STATUS_LIST } from '../constants'

export const uid = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36)

export const pad = (v: string | number): string => (/^\d+$/.test(String(v)) ? String(v).padStart(2, '0') : String(v))

export const shotLabel = (s: Pick<Shot, 'scene' | 'shot'>): string => `SC-${pad(s.scene)} / SH-${pad(s.shot)}`

export function fmtDuration(sec: number): string {
  const t = Math.round(sec * 10) / 10
  if (t < 60) return `${t}s`
  const m = Math.floor(t / 60)
  const s = Math.round((t - m * 60) * 10) / 10
  return `${m}m ${s}s`
}

export function blankShot(p: Pick<Project, 'defaultLens'>, ref?: Shot): Shot {
  return {
    id: uid(),
    scene: ref?.scene ?? '01',
    shot: '01',
    size: ref?.size ?? 'MS',
    angle: 'Eye Level',
    movement: 'Static',
    lens: p.defaultLens,
    lighting: '',
    audio: '',
    notes: '',
    duration: ref?.duration ?? 3,
    status: 'planned',
    image: null,
    fit: 'cover',
    strokes: [],
  }
}

/** Penomoran ulang shot per-scene secara berurutan. Identitas objek dipertahankan bila tidak berubah. */
export function withNumbers(p: Project): Project {
  if (!p.autoNumber) return p
  const counters: Record<string, number> = {}
  let changed = false
  const shots = p.shots.map((s) => {
    const n = (counters[s.scene] = (counters[s.scene] ?? 0) + 1)
    const num = pad(n)
    if (s.shot === num) return s
    changed = true
    return { ...s, shot: num }
  })
  return changed ? { ...p, shots } : p
}

export function createProject(name = 'Proyek Baru'): Project {
  const now = Date.now()
  const base: Project = {
    id: uid(),
    name,
    aspect: '16:9',
    fps: 24,
    defaultLens: '35mm',
    autoNumber: true,
    createdAt: now,
    updatedAt: now,
    shots: [],
  }
  return withNumbers({ ...base, shots: [blankShot(base)] })
}

export function createSampleProject(): Project {
  const p = createProject('Contoh: Iklan Kopi 30 Detik')
  const mk = (patch: Partial<Shot>): Shot => ({ ...blankShot(p), ...patch })
  p.shots = [
    mk({ scene: '01', size: 'EWS', angle: "Bird's Eye", movement: 'Crane/Drone', lens: '24mm', duration: 4, lighting: 'Golden hour, hangat', audio: 'Ambience pagi, musik lembut masuk', notes: 'Establishing kebun kopi, drone naik perlahan.' }),
    mk({ scene: '01', size: 'MS', angle: 'Eye Level', movement: 'Slider', lens: '50mm', duration: 3, lighting: 'Backlight kuning', audio: 'SFX: langkah di tanah', notes: 'Petani memetik biji kopi, slider kiri ke kanan.' }),
    mk({ scene: '02', size: 'ECU', angle: 'Low Angle', movement: 'Static', lens: '100mm macro', duration: 2, lighting: 'Soft side light', audio: 'SFX: uap & seduhan', notes: 'Tetesan kopi masuk ke cangkir.' }),
    mk({ scene: '02', size: 'CU', angle: 'Eye Level', movement: 'Handheld', lens: '85mm', duration: 5, lighting: 'Window light', audio: 'VO: "Setiap pagi punya cerita."', notes: 'Talent tersenyum menyesap kopi.' }),
  ]
  return withNumbers(p)
}

const str = (v: unknown, d: string): string => (typeof v === 'string' ? v : d)
const num = (v: unknown, d: number): number => (typeof v === 'number' && isFinite(v) ? v : d)

function normalizeStroke(raw: any): Stroke | null {
  if (!raw || !Array.isArray(raw.pts)) return null
  const pts = raw.pts
    .filter((p: any) => Array.isArray(p) && typeof p[0] === 'number' && typeof p[1] === 'number')
    .map((p: any) => [p[0], p[1]] as [number, number])
  if (!pts.length) return null
  const tool = raw.tool === 'line' || raw.tool === 'arrow' ? raw.tool : 'pen'
  return { id: uid(), tool, color: str(raw.color, '#f2b04b'), width: num(raw.width, 8), pts }
}

function normalizeShot(raw: any, fresh: boolean, defaultLens: string): Shot {
  const sizeOk = SHOT_SIZES.some((s) => s.value === raw?.size)
  return {
    id: fresh || typeof raw?.id !== 'string' ? uid() : raw.id,
    scene: str(raw?.scene, '01'),
    shot: str(raw?.shot, '01'),
    size: (sizeOk ? raw.size : 'MS') as ShotSize,
    angle: str(raw?.angle, 'Eye Level'),
    movement: str(raw?.movement, 'Static'),
    lens: str(raw?.lens, defaultLens),
    lighting: str(raw?.lighting, ''),
    audio: str(raw?.audio, ''),
    notes: str(raw?.notes, ''),
    duration: Math.max(0, num(raw?.duration, 3)),
    status: (STATUS_LIST.includes(raw?.status) ? raw.status : 'planned') as ShotStatus,
    image: typeof raw?.image === 'string' && raw.image.startsWith('data:image/') ? raw.image : null,
    fit: raw?.fit === 'contain' ? 'contain' : 'cover',
    strokes: Array.isArray(raw?.strokes) ? (raw.strokes.map(normalizeStroke).filter(Boolean) as Stroke[]) : [],
  }
}

/** Membersihkan data tak tepercaya (impor JSON / data lama) menjadi Project yang valid. */
export function normalizeProject(raw: any, fresh: boolean): Project {
  const aspect = (ASPECTS.some((a) => a.value === raw?.aspect) ? raw.aspect : '16:9') as AspectRatio
  const defaultLens = str(raw?.defaultLens, '35mm')
  const now = Date.now()
  const shots: Shot[] = Array.isArray(raw?.shots) ? raw.shots.map((s: any) => normalizeShot(s, fresh, defaultLens)) : []
  return {
    id: fresh || typeof raw?.id !== 'string' ? uid() : raw.id,
    name: str(raw?.name, 'Proyek Tanpa Nama'),
    aspect,
    fps: num(raw?.fps, 24),
    defaultLens,
    autoNumber: raw?.autoNumber !== false,
    createdAt: num(raw?.createdAt, now),
    updatedAt: num(raw?.updatedAt, now),
    shots,
  }
}

export function projectStats(p: Project) {
  return {
    shots: p.shots.length,
    scenes: new Set(p.shots.map((s) => s.scene)).size,
    duration: p.shots.reduce((a, s) => a + s.duration, 0),
    done: p.shots.filter((s) => s.status === 'shot' || s.status === 'pick').length,
  }
}

// ---------- template proyek ----------
type Row = [scene: string, size: ShotSize, angle: string, movement: string, lens: string, duration: number, notes: string]

const TEMPLATE_DATA: Record<string, { name: string; fps: number; lens: string; rows: Row[] }> = {
  'talking-head': {
    name: 'YouTube Talking Head + B-Roll',
    fps: 30,
    lens: '50mm',
    rows: [
      ['01', 'MS', 'Eye Level', 'Static', '50mm', 8, 'Hook: presenter bicara ke kamera.'],
      ['01', 'CU', 'Eye Level', 'Static', '85mm', 6, 'Poin utama, punch-in.'],
      ['02', 'CU', 'Eye Level', 'Slider', '35mm', 4, 'B-roll: detail produk/aktivitas.'],
      ['02', 'WS', 'High Angle', 'Static', '24mm', 4, 'B-roll: suasana/ruang.'],
      ['03', 'MS', 'Eye Level', 'Static', '50mm', 6, 'CTA dan outro.'],
    ],
  },
  tvc30: {
    name: 'TVC / Iklan 30 Detik',
    fps: 24,
    lens: '35mm',
    rows: [
      ['01', 'EWS', "Bird's Eye", 'Crane/Drone', '24mm', 4, 'Establishing lokasi.'],
      ['01', 'MS', 'Eye Level', 'Gimbal', '35mm', 5, 'Masalah/situasi talent.'],
      ['02', 'CU', 'Eye Level', 'Handheld', '50mm', 4, 'Reaksi talent.'],
      ['02', 'ECU', 'Low Angle', 'Slider', '100mm macro', 3, 'Hero shot produk.'],
      ['03', 'MS', 'Eye Level', 'Static', '35mm', 6, 'Talent memakai produk.'],
      ['03', 'WS', 'Eye Level', 'Dolly/Tracking', '24mm', 5, 'Resolusi / lifestyle.'],
      ['04', 'MCU', 'Eye Level', 'Static', '50mm', 3, 'Packshot, logo, tagline.'],
    ],
  },
  event: {
    name: 'Event Highlight',
    fps: 30,
    lens: '35mm',
    rows: [
      ['01', 'EWS', "Bird's Eye", 'Crane/Drone', '24mm', 4, 'Suasana venue.'],
      ['01', 'WS', 'Eye Level', 'Gimbal', '24mm', 4, 'Crowd dan dekorasi.'],
      ['02', 'MS', 'Eye Level', 'Handheld', '35mm', 5, 'Pembicara/performer di panggung.'],
      ['02', 'CU', 'Eye Level', 'Handheld', '85mm', 4, 'Reaksi audiens.'],
      ['03', 'ECU', 'Eye Level', 'Static', '100mm', 3, 'Detail: tangan, logo, hidangan.'],
      ['03', 'MLS', 'Eye Level', 'Gimbal', '35mm', 5, 'Interaksi tamu.'],
      ['04', 'WS', 'Eye Level', 'Static', '24mm', 4, 'Penutup, suasana akhir.'],
    ],
  },
}

export const TEMPLATES = [
  { key: 'blank', label: 'Proyek kosong' },
  ...Object.entries(TEMPLATE_DATA).map(([key, t]) => ({ key, label: t.name })),
]

export function createFromTemplate(key: string): Project {
  const t = TEMPLATE_DATA[key]
  if (!t) return createProject()
  const p = createProject(t.name)
  p.fps = t.fps
  p.defaultLens = t.lens
  p.shots = t.rows.map(([scene, size, angle, movement, lens, duration, notes]) => ({
    ...blankShot(p),
    scene,
    size,
    angle,
    movement,
    lens,
    duration,
    notes,
  }))
  return withNumbers(p)
}
