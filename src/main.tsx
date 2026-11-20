import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { useStore } from './store'
import { loadData, saveData } from './lib/io'
import './index.css'

// Autosave debounced: semua perubahan data disimpan 500 ms setelah edit terakhir.
function setupAutosave() {
  let timer: number | undefined

  const flush = async () => {
    const s = useStore.getState()
    const ok = await saveData({
      version: 1,
      projects: s.projects,
      activeId: s.activeId,
      cardSize: s.cardSize,
      printLayout: s.printLayout,
    })
    if (ok) useStore.setState({ saveState: 'saved' })
    else useStore.getState().notify('Gagal menyimpan otomatis (penyimpanan penuh?). Ekspor JSON untuk cadangan.')
  }

  useStore.subscribe((s, prev) => {
    if (!s.ready) return
    if (s.projects !== prev.projects || s.activeId !== prev.activeId || s.cardSize !== prev.cardSize || s.printLayout !== prev.printLayout) {
      useStore.setState({ saveState: 'dirty' })
      window.clearTimeout(timer)
      timer = window.setTimeout(flush, 500)
    }
  })

  // Simpan segera saat jendela disembunyikan/ditutup.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && useStore.getState().saveState === 'dirty') {
      window.clearTimeout(timer)
      void flush()
    }
  })
  window.addEventListener('beforeunload', () => {
    if (useStore.getState().saveState === 'dirty') void flush()
  })
}

function registerPwa() {
  // Hanya untuk mode web (iPad/browser). Di Electron (file://) tidak dipakai.
  if (window.shotflow || !('serviceWorker' in navigator) || !location.protocol.startsWith('http')) return
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((e) => console.warn('SW gagal didaftarkan', e))
  })
  // Minta penyimpanan permanen agar iOS/Safari tidak menghapus data saat ruang menipis.
  void navigator.storage?.persist?.()
}

loadData().then((data) => {
  registerPwa()
  useStore.getState().hydrate(data)
  setupAutosave()
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
})
