import type { AspectRatio, PrintLayout, ShotSize, ShotStatus } from './types'

export const ASPECTS: { value: AspectRatio; label: string; ratio: number }[] = [
  { value: '16:9', label: '16:9 · HD / YouTube', ratio: 16 / 9 },
  { value: '9:16', label: '9:16 · Vertikal', ratio: 9 / 16 },
  { value: '2.39:1', label: '2.39:1 · Cinemascope', ratio: 2.39 },
  { value: '4:3', label: '4:3 · Klasik', ratio: 4 / 3 },
  { value: '1:1', label: '1:1 · Persegi', ratio: 1 },
]

export const ratioOf = (a: AspectRatio): number => ASPECTS.find((x) => x.value === a)?.ratio ?? 16 / 9

export const FPS_OPTIONS = [24, 30, 60, 120]

export const SHOT_SIZES: { value: ShotSize; label: string }[] = [
  { value: 'ECU', label: 'Extreme Close-Up' },
  { value: 'CU', label: 'Close-Up' },
  { value: 'MCU', label: 'Medium Close-Up' },
  { value: 'MS', label: 'Medium Shot' },
  { value: 'MLS', label: 'Medium Long Shot' },
  { value: 'WS', label: 'Wide Shot' },
  { value: 'EWS', label: 'Extreme Wide Shot' },
]

export const ANGLES = ['Eye Level', 'High Angle', 'Low Angle', "Bird's Eye", 'Dutch Angle']

export const MOVEMENTS = ['Static', 'Pan', 'Tilt', 'Dolly/Tracking', 'Slider', 'Gimbal', 'Handheld', 'Crane/Drone']

export const LENS_SUGGESTIONS = ['16mm', '24mm', '35mm', '50mm', '85mm', '135mm', '24-70mm', '70-200mm']

export const PRINT_LAYOUTS: Record<PrintLayout, { label: string; orient: 'portrait' | 'landscape'; cols: number; portraitH: string }> = {
  'portrait-2': { label: 'A4 Portrait · 2 kolom', orient: 'portrait', cols: 2, portraitH: '58mm' },
  'landscape-3': { label: 'A4 Landscape · 3 kolom', orient: 'landscape', cols: 3, portraitH: '48mm' },
  'landscape-2': { label: 'A4 Landscape · 2 kolom', orient: 'landscape', cols: 2, portraitH: '70mm' },
}

export const SKETCH_COLORS = ['#f2b04b', '#5fcfe0', '#ff5d5d', '#7ee787', '#ffffff']
export const SKETCH_WIDTHS = [
  { label: 'S', value: 4 },
  { label: 'M', value: 8 },
  { label: 'L', value: 14 },
]

export const STATUS_STYLE: Record<ShotStatus, { label: string; cls: string }> = {
  planned: { label: 'Planned', cls: 'bg-white/10 text-mute' },
  shot: { label: 'Shot', cls: 'bg-accent2/20 text-accent2' },
  pick: { label: 'Pick', cls: 'bg-green-400/20 text-green-300' },
  reshoot: { label: 'Reshoot', cls: 'bg-red-400/20 text-red-300' },
}
export const STATUS_LIST = Object.keys(STATUS_STYLE) as ShotStatus[]
