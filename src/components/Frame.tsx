import type { CSSProperties, ReactNode } from 'react'
import type { Stroke } from '../types'
import { StrokesLayer } from '../lib/strokes'

interface Props {
  ratio: number
  image: string | null
  fit?: 'cover' | 'contain'
  strokes?: Stroke[]
  className?: string
  style?: CSSProperties
  print?: boolean
  children?: ReactNode
}

/** Frame visual dengan aspect ratio proyek: gambar referensi + lapisan sketsa. */
export function Frame({ ratio, image, fit = 'cover', strokes = [], className = '', style, print = false, children }: Props) {
  return (
    <div
      className={`relative overflow-hidden ${print ? 'bg-neutral-200' : 'bg-[#101215]'} ${className}`}
      style={{ aspectRatio: String(ratio), ...style }}
    >
      {image ? (
        <img
          src={image}
          alt=""
          draggable={false}
          className={`absolute inset-0 h-full w-full ${fit === 'cover' ? 'object-cover' : 'object-contain'}`}
        />
      ) : (
        <div
          className={`absolute inset-0 flex items-center justify-center text-[10px] uppercase tracking-[0.2em] ${print ? 'text-neutral-400' : 'text-mute/50'}`}
          style={{
            backgroundImage: print
              ? 'repeating-linear-gradient(135deg,#e5e5e5 0 10px,#ebebeb 10px 20px)'
              : 'repeating-linear-gradient(135deg,#14171b 0 10px,#171a1f 10px 20px)',
          }}
        >
          Belum ada frame
        </div>
      )}
      {strokes.length > 0 && <StrokesLayer strokes={strokes} ratio={ratio} />}
      {children}
    </div>
  )
}
