import { useStore } from '../store'

/** Skala turun + kompres ke JPEG agar file data proyek tetap kecil dan UI tidak lag. */
export async function fileToDataUrl(file: Blob, maxDim = 1600, quality = 0.86): Promise<string> {
  const bmp = await createImageBitmap(file)
  const scale = Math.min(1, maxDim / Math.max(bmp.width, bmp.height))
  const w = Math.max(1, Math.round(bmp.width * scale))
  const h = Math.max(1, Math.round(bmp.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, w, h)
  ctx.drawImage(bmp, 0, 0, w, h)
  bmp.close()
  return canvas.toDataURL('image/jpeg', quality)
}

export async function setShotImage(shotId: string, file: Blob): Promise<boolean> {
  const { updateShot, notify } = useStore.getState()
  try {
    const image = await fileToDataUrl(file)
    updateShot(shotId, { image })
    return true
  } catch (e) {
    console.error(e)
    notify('Gambar tidak dapat dibaca.')
    return false
  }
}

export const firstImageFile = (files: FileList | File[] | null | undefined): File | undefined =>
  files ? Array.from(files).find((f) => f.type.startsWith('image/')) : undefined
