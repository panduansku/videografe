export type AspectRatio = '16:9' | '9:16' | '2.39:1' | '4:3' | '1:1'
export type ShotSize = 'ECU' | 'CU' | 'MCU' | 'MS' | 'MLS' | 'WS' | 'EWS'
export type Tool = 'pen' | 'line' | 'arrow'
export type PrintLayout = 'portrait-2' | 'landscape-3' | 'landscape-2'

/** Koordinat dinormalisasi 0..1 relatif terhadap frame, sehingga aman saat aspect ratio berubah. */
export interface Stroke {
  id: string
  tool: Tool
  color: string
  width: number // satuan viewBox 1000px lebar
  pts: [number, number][]
}

export interface Shot {
  id: string
  scene: string
  shot: string
  size: ShotSize
  angle: string
  movement: string
  lens: string
  lighting: string
  audio: string
  notes: string
  duration: number // detik
  image: string | null // data URL (sudah dikompres)
  fit: 'cover' | 'contain'
  strokes: Stroke[]
}

export interface Project {
  id: string
  name: string
  aspect: AspectRatio
  fps: number
  defaultLens: string
  autoNumber: boolean
  createdAt: number
  updatedAt: number
  shots: Shot[]
}

export interface Persisted {
  version: 1
  projects: Project[]
  activeId: string
  cardSize: number
  printLayout: PrintLayout
}
