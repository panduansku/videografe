import { useEffect } from 'react'
import { useStore } from './store'
import { firstImageFile, setShotImage } from './lib/image'
import { shotLabel } from './lib/project'
import { Topbar } from './components/Topbar'
import { ShotGrid } from './components/ShotGrid'
import { Inspector } from './components/Inspector'
import { SketchEditor } from './components/SketchEditor'
import { PrintView } from './components/PrintView'

function isTyping(t: EventTarget | null): boolean {
  const el = t as HTMLElement | null
  return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable)
}

export default function App() {
  const toast = useStore((s) => s.toast)

  useEffect(() => {
    // Tempel gambar (Ctrl+V / Cmd+V) -> masuk ke shot terpilih, atau buat shot baru bila belum ada yang dipilih.
    const onPaste = (e: ClipboardEvent) => {
      const img = firstImageFile(e.clipboardData?.files)
      if (!img) return
      e.preventDefault()
      const st = useStore.getState()
      const id = st.selectedId ?? st.addShot(null)
      void setShotImage(id, img).then((ok) => ok && st.notify('Gambar ditempel ke frame.'))
    }

    const onKey = (e: KeyboardEvent) => {
      const st = useStore.getState()
      if (st.sketchId || isTyping(e.target)) return
      const mod = e.ctrlKey || e.metaKey
      const project = st.projects.find((p) => p.id === st.activeId)
      if (!project) return
      const idx = project.shots.findIndex((s) => s.id === st.selectedId)
      const cur = project.shots[idx]

      if (mod && e.key.toLowerCase() === 'd' && cur) {
        e.preventDefault()
        st.duplicateShot(cur.id)
      } else if (!mod && e.key.toLowerCase() === 'n') {
        e.preventDefault()
        st.addShot(st.selectedId)
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && cur) {
        e.preventDefault()
        if (window.confirm(`Hapus ${shotLabel(cur)}?`)) st.deleteShot(cur.id)
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault()
        const next = project.shots[Math.min(project.shots.length - 1, Math.max(0, (idx < 0 ? 0 : idx) + (e.key === 'ArrowRight' ? 1 : -1)))]
        if (next) st.select(next.id)
      } else if (e.key === 'Enter' && cur) {
        st.setSketch(cur.id)
      }
    }

    // Cegah browser membuka gambar yang dijatuhkan di luar area frame.
    const blockDrop = (e: globalThis.DragEvent) => e.preventDefault()

    document.addEventListener('paste', onPaste)
    window.addEventListener('keydown', onKey)
    window.addEventListener('dragover', blockDrop)
    window.addEventListener('drop', blockDrop)
    return () => {
      document.removeEventListener('paste', onPaste)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('dragover', blockDrop)
      window.removeEventListener('drop', blockDrop)
    }
  }, [])

  return (
    <>
      <div id="app-root" className="flex h-screen flex-col bg-bg text-text">
        <Topbar />
        <div className="flex min-h-0 flex-1">
          <main className="min-w-0 flex-1">
            <ShotGrid />
          </main>
          <aside className="w-[380px] shrink-0 border-l border-line">
            <Inspector />
          </aside>
        </div>

        <SketchEditor />

        {toast && (
          <div className="pointer-events-none fixed bottom-5 left-1/2 z-[200] -translate-x-1/2 rounded-md border border-line bg-panel2 px-4 py-2 text-[13px] shadow-xl">
            {toast}
          </div>
        )}
      </div>
      <PrintView />
    </>
  )
}
