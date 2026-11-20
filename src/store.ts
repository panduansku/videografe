import { create } from 'zustand'
import type { AspectRatio, Persisted, PrintLayout, Project, Shot } from './types'
import { isCompact } from './lib/useMedia'
import { blankShot, createFromTemplate, createProject, createSampleProject, normalizeProject, uid, withNumbers } from './lib/project'

type ProjectMeta = Partial<Pick<Project, 'name' | 'aspect' | 'fps' | 'defaultLens' | 'autoNumber'>>

interface State {
  ready: boolean
  projects: Project[]
  activeId: string
  selectedId: string | null
  cardSize: number
  printLayout: PrintLayout
  toast: string | null
  saveState: 'saved' | 'dirty'
  sketchId: string | null
  inspectorOpen: boolean

  hydrate: (d: Persisted | null) => void
  notify: (msg: string) => void
  setCardSize: (n: number) => void
  setPrintLayout: (l: PrintLayout) => void
  select: (id: string | null) => void
  setSketch: (id: string | null) => void
  setInspector: (open: boolean) => void

  newProject: (template?: string) => void
  switchProject: (id: string) => void
  updateProject: (patch: ProjectMeta) => void
  duplicateProject: () => void
  deleteProject: () => void
  addImportedProject: (p: Project) => void

  addShot: (afterId?: string | null) => string
  updateShot: (id: string, patch: Partial<Shot>) => void
  duplicateShot: (id: string) => void
  deleteShot: (id: string) => void
  moveShot: (dragId: string, targetId: string, after: boolean) => void
  moveShotBy: (id: string, delta: number) => void
}

let toastTimer: number | undefined

export const useStore = create<State>()((set, get) => {
  const patchActive = (fn: (p: Project) => Project) =>
    set((s) => ({
      projects: s.projects.map((p) => (p.id === s.activeId ? { ...fn(p), updatedAt: Date.now() } : p)),
    }))

  const activeOf = (s: State) => s.projects.find((p) => p.id === s.activeId)!

  return {
    ready: false,
    projects: [],
    activeId: '',
    selectedId: null,
    cardSize: 280,
    printLayout: 'portrait-2',
    toast: null,
    saveState: 'saved',
    sketchId: null,
    inspectorOpen: false,

    hydrate: (d) => {
      let projects = (d?.projects ?? []).map((p) => normalizeProject(p, false))
      if (!projects.length) projects = [createSampleProject()]
      const activeId = projects.some((p) => p.id === d?.activeId) ? (d!.activeId as string) : projects[0].id
      const active = projects.find((p) => p.id === activeId)!
      set({
        ready: true,
        projects,
        activeId,
        selectedId: active.shots[0]?.id ?? null,
        cardSize: typeof d?.cardSize === 'number' ? Math.min(460, Math.max(200, d.cardSize)) : 280,
        printLayout: d?.printLayout === 'landscape-3' || d?.printLayout === 'landscape-2' ? d.printLayout : 'portrait-2',
      })
    },

    notify: (msg) => {
      set({ toast: msg })
      window.clearTimeout(toastTimer)
      toastTimer = window.setTimeout(() => set({ toast: null }), 2400)
    },

    setCardSize: (n) => set({ cardSize: n }),
    setPrintLayout: (l) => set({ printLayout: l }),
    // Di layar ringkas (iPad) memilih shot langsung membuka panel inspector.
    select: (id) => set({ selectedId: id, inspectorOpen: id !== null && isCompact() }),
    setSketch: (id) => set({ sketchId: id }),
    setInspector: (open) => set({ inspectorOpen: open }),

    // ---------- proyek ----------
    newProject: (template = 'blank') => {
      const p = createFromTemplate(template)
      set((s) => ({ projects: [...s.projects, p], activeId: p.id, selectedId: p.shots[0].id }))
    },

    switchProject: (id) => {
      const p = get().projects.find((x) => x.id === id)
      if (p) set({ activeId: id, selectedId: p.shots[0]?.id ?? null, sketchId: null, inspectorOpen: false })
    },

    updateProject: (patch) =>
      patchActive((p) => {
        const next = { ...p, ...patch }
        return patch.autoNumber ? withNumbers(next) : next
      }),

    duplicateProject: () => {
      const src = activeOf(get())
      const copy = normalizeProject(JSON.parse(JSON.stringify(src)), true)
      copy.name = `${src.name} (salinan)`
      set((s) => ({ projects: [...s.projects, copy], activeId: copy.id, selectedId: copy.shots[0]?.id ?? null }))
    },

    deleteProject: () => {
      const { projects, activeId } = get()
      let rest = projects.filter((p) => p.id !== activeId)
      if (!rest.length) rest = [createProject()]
      set({ projects: rest, activeId: rest[0].id, selectedId: rest[0].shots[0]?.id ?? null, sketchId: null })
    },

    addImportedProject: (p) => set((s) => ({ projects: [...s.projects, p], activeId: p.id, selectedId: p.shots[0]?.id ?? null })),

    // ---------- shot ----------
    addShot: (afterId) => {
      let newId = ''
      patchActive((p) => {
        const idx = afterId ? p.shots.findIndex((s) => s.id === afterId) : p.shots.length - 1
        const shot = blankShot(p, p.shots[idx])
        newId = shot.id
        const shots = [...p.shots]
        shots.splice(idx + 1, 0, shot)
        return withNumbers({ ...p, shots })
      })
      set({ selectedId: newId, inspectorOpen: isCompact() })
      return newId
    },

    updateShot: (id, patch) =>
      patchActive((p) => {
        const next = { ...p, shots: p.shots.map((s) => (s.id === id ? { ...s, ...patch } : s)) }
        return patch.scene !== undefined ? withNumbers(next) : next
      }),

    duplicateShot: (id) => {
      let newId = ''
      patchActive((p) => {
        const idx = p.shots.findIndex((s) => s.id === id)
        if (idx < 0) return p
        const src = p.shots[idx]
        const copy: Shot = { ...src, id: uid(), strokes: src.strokes.map((st) => ({ ...st, id: uid() })) }
        newId = copy.id
        const shots = [...p.shots]
        shots.splice(idx + 1, 0, copy)
        return withNumbers({ ...p, shots })
      })
      if (newId) set({ selectedId: newId })
    },

    deleteShot: (id) => {
      const before = activeOf(get())
      const idx = before.shots.findIndex((s) => s.id === id)
      if (idx < 0) return
      patchActive((p) => withNumbers({ ...p, shots: p.shots.filter((s) => s.id !== id) }))
      const after = activeOf(get()).shots
      const wasSelected = get().selectedId === id
      if (wasSelected) set({ selectedId: after[Math.min(idx, after.length - 1)]?.id ?? null })
    },

    moveShotBy: (id, delta) =>
      patchActive((p) => {
        const i = p.shots.findIndex((s) => s.id === id)
        const j = i + delta
        if (i < 0 || j < 0 || j >= p.shots.length) return p
        const shots = [...p.shots]
        ;[shots[i], shots[j]] = [shots[j], shots[i]]
        return withNumbers({ ...p, shots })
      }),

    moveShot: (dragId, targetId, after) =>
      patchActive((p) => {
        if (dragId === targetId) return p
        const moving = p.shots.find((s) => s.id === dragId)
        if (!moving) return p
        const shots = p.shots.filter((s) => s.id !== dragId)
        let idx = shots.findIndex((s) => s.id === targetId)
        if (idx < 0) return p
        if (after) idx++
        shots.splice(idx, 0, moving)
        return withNumbers({ ...p, shots })
      }),
  }
})

export const useActive = (): Project => useStore((s) => s.projects.find((p) => p.id === s.activeId) as Project)

export type { AspectRatio }
