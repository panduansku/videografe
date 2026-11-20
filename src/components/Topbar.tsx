import { useStore, useActive } from '../store'
import { ASPECTS, FPS_OPTIONS, PRINT_LAYOUTS } from '../constants'
import { fmtDuration, projectStats, TEMPLATES } from '../lib/project'
import { exportCsv, exportJson, importJson, printPdf } from '../lib/io'
import type { AspectRatio, PrintLayout } from '../types'
import { Icon } from './Icon'
import { MenuItem, Popover } from './Popover'

export function Topbar() {
  const project = useActive()
  const projects = useStore((s) => s.projects)
  const saveState = useStore((s) => s.saveState)
  const printLayout = useStore((s) => s.printLayout)
  const st = useStore.getState
  const stats = projectStats(project)

  const run = async (fn: () => Promise<unknown>, okMsg?: string) => {
    try {
      const r = await fn()
      if (okMsg && r !== false && r !== null) st().notify(okMsg)
    } catch (e) {
      st().notify(e instanceof Error ? e.message : 'Terjadi kesalahan.')
    }
  }

  const doImport = () =>
    run(async () => {
      const p = await importJson()
      if (p) {
        st().addImportedProject(p)
        st().notify(`Proyek "${p.name}" diimpor.`)
      }
      return p
    })

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-line bg-panel px-4">
      {/* Logo */}
      <div className="flex items-center gap-2 pr-1">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent text-[#1a1407]">
          <Icon name="film" size={16} />
        </div>
        <span className="text-[15px] font-bold tracking-tight">
          Shot<span className="text-accent">Flow</span>
        </span>
      </div>

      {/* Menu proyek + nama */}
      <Popover
        width="w-72"
        trigger={() => (
          <button className="btn">
            Proyek <Icon name="chevron" size={14} />
          </button>
        )}
      >
        {(close) => (
          <>
            <div className="max-h-60 overflow-y-auto">
              {projects.map((p) => (
                <MenuItem
                  key={p.id}
                  active={p.id === project.id}
                  onClick={() => {
                    st().switchProject(p.id)
                    close()
                  }}
                >
                  <span className="min-w-0 flex-1 truncate">{p.name}</span>
                  <span className="font-mono text-[10px] text-mute">{p.shots.length} shot</span>
                </MenuItem>
              ))}
            </div>
            <div className="my-1 border-t border-line" />
            <div className="px-2.5 pb-0.5 pt-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-mute">Proyek baru</div>
            {TEMPLATES.map((t) => (
              <MenuItem
                key={t.key}
                onClick={() => {
                  st().newProject(t.key)
                  close()
                }}
              >
                <Icon name="plus" size={14} /> {t.label}
              </MenuItem>
            ))}
            <MenuItem
              onClick={() => {
                st().duplicateProject()
                close()
              }}
            >
              <Icon name="copy" size={14} /> Duplikat proyek ini
            </MenuItem>
            <MenuItem
              danger
              onClick={() => {
                close()
                if (window.confirm(`Hapus proyek "${project.name}" beserta semua shot-nya?`)) st().deleteProject()
              }}
            >
              <Icon name="trash" size={14} /> Hapus proyek ini
            </MenuItem>
          </>
        )}
      </Popover>

      <input
        value={project.name}
        onChange={(e) => st().updateProject({ name: e.target.value })}
        spellCheck={false}
        aria-label="Nama proyek"
        className="w-64 rounded-md border border-transparent bg-transparent px-2 py-1 text-[15px] font-semibold outline-none hover:border-line focus:border-accent/70 focus:bg-panel2"
      />

      {/* Pengaturan proyek */}
      <div className="ml-1 flex items-center gap-2">
        <select
          className="input !w-auto"
          value={project.aspect}
          onChange={(e) => st().updateProject({ aspect: e.target.value as AspectRatio })}
          title="Aspect ratio"
        >
          {ASPECTS.map((a) => (
            <option key={a.value} value={a.value}>
              {a.label}
            </option>
          ))}
        </select>
        <select className="input !w-auto" value={project.fps} onChange={(e) => st().updateProject({ fps: Number(e.target.value) })} title="Frame rate">
          {FPS_OPTIONS.map((f) => (
            <option key={f} value={f}>
              {f} fps
            </option>
          ))}
        </select>
        <input
          className="input !w-36"
          value={project.defaultLens}
          onChange={(e) => st().updateProject({ defaultLens: e.target.value })}
          placeholder="Lensa default"
          title="Lens / kamera default untuk shot baru"
          spellCheck={false}
        />
      </div>

      <div className="flex-1" />

      {/* Ringkasan */}
      <div className="flex items-center gap-4 font-mono text-[12px]">
        <Stat label="SHOT" value={String(stats.shots)} />
        <Stat label="SCENE" value={String(stats.scenes)} />
        <Stat label="TERAMBIL" value={`${stats.done}/${stats.shots}`} />
        <Stat label="DURASI" value={fmtDuration(stats.duration)} accent />
        <span className={`text-[11px] ${saveState === 'saved' ? 'text-mute' : 'text-accent'}`}>{saveState === 'saved' ? '● Tersimpan' : '○ Menyimpan…'}</span>
      </div>

      <button className="btn btn-primary" onClick={() => st().addShot(st().selectedId)} title="Tambah shot setelah shot terpilih (N)">
        <Icon name="plus" size={15} /> Shot
      </button>

      <Popover
        align="right"
        width="w-72"
        trigger={() => (
          <button className="btn">
            <Icon name="download" size={15} /> Ekspor <Icon name="chevron" size={14} />
          </button>
        )}
      >
        {(close) => (
          <>
            <div className="px-2.5 pb-1.5 pt-1">
              <span className="label">Layout halaman PDF</span>
              <select className="input" value={printLayout} onChange={(e) => st().setPrintLayout(e.target.value as PrintLayout)}>
                {(Object.keys(PRINT_LAYOUTS) as PrintLayout[]).map((k) => (
                  <option key={k} value={k}>
                    {PRINT_LAYOUTS[k].label}
                  </option>
                ))}
              </select>
            </div>
            <MenuItem
              onClick={() => {
                close()
                run(() => printPdf(project.name), window.shotflow ? 'PDF tersimpan.' : undefined)
              }}
            >
              <Icon name="printer" size={14} /> Cetak / Simpan PDF
            </MenuItem>
            <MenuItem
              onClick={() => {
                close()
                run(() => exportJson(project), 'JSON proyek diekspor.')
              }}
            >
              <Icon name="download" size={14} /> Ekspor JSON proyek
            </MenuItem>
            <MenuItem
              onClick={() => {
                close()
                run(() => exportCsv(project), 'CSV shot list diekspor.')
              }}
            >
              <Icon name="download" size={14} /> Ekspor CSV (shot list)
            </MenuItem>
            <div className="my-1 border-t border-line" />
            <MenuItem
              onClick={() => {
                close()
                doImport()
              }}
            >
              <Icon name="upload" size={14} /> Impor JSON proyek
            </MenuItem>
          </>
        )}
      </Popover>
    </header>
  )
}

function Stat({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex flex-col items-end leading-tight">
      <span className="text-[9px] tracking-[0.15em] text-mute">{label}</span>
      <span className={`text-[14px] font-semibold ${accent ? 'text-accent' : 'text-text'}`}>{value}</span>
    </div>
  )
}
