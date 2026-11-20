import type { Persisted, Project } from '../types'
import { normalizeProject, pad } from './project'

const KEY = 'shotflow:v1'

// ---------- penyimpanan otomatis ----------
export async function loadData(): Promise<Persisted | null> {
  try {
    const raw = window.shotflow ? await window.shotflow.load() : localStorage.getItem(KEY)
    if (!raw) return null
    const d = JSON.parse(raw)
    return d && Array.isArray(d.projects) ? (d as Persisted) : null
  } catch (e) {
    console.error('load failed', e)
    return null
  }
}

export async function saveData(d: Persisted): Promise<boolean> {
  const json = JSON.stringify(d)
  if (window.shotflow) return window.shotflow.save(json)
  try {
    localStorage.setItem(KEY, json)
    return true
  } catch {
    return false // kemungkinan kuota localStorage penuh (mode browser). Di Electron tidak ada batas ini.
  }
}

// ---------- file helper ----------
export const safeName = (s: string): string => s.replace(/[\\/:*?"<>|]+/g, '_').trim() || 'shotflow'

function browserDownload(name: string, data: string, mime: string) {
  const url = URL.createObjectURL(new Blob([data], { type: mime }))
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

async function saveTextFile(name: string, data: string, mime: string, label: string, ext: string): Promise<boolean> {
  if (window.shotflow) {
    return window.shotflow.saveFile({ defaultName: name, filters: [{ name: label, extensions: [ext] }], data })
  }
  browserDownload(name, data, mime)
  return true
}

function pickTextFile(): Promise<string | null> {
  if (window.shotflow) {
    return window.shotflow.openFile({ filters: [{ name: 'JSON', extensions: ['json'] }] }).then((r) => r?.data ?? null)
  }
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json,application/json'
    input.onchange = async () => resolve(input.files?.[0] ? await input.files[0].text() : null)
    input.addEventListener('cancel', () => resolve(null))
    input.click()
  })
}

// ---------- JSON ----------
export function exportJson(p: Project): Promise<boolean> {
  const payload = { app: 'ShotFlow', version: 1, exportedAt: new Date().toISOString(), project: p }
  return saveTextFile(`${safeName(p.name)}.shotflow.json`, JSON.stringify(payload, null, 2), 'application/json', 'ShotFlow JSON', 'json')
}

/** Mengembalikan Project baru (id baru) dari file JSON, atau null jika dibatalkan. Melempar Error bila format salah. */
export async function importJson(): Promise<Project | null> {
  const text = await pickTextFile()
  if (text == null) return null
  let data: any
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('File bukan JSON yang valid.')
  }
  const raw = data?.project ?? data
  if (!raw || !Array.isArray(raw.shots)) throw new Error('Format proyek ShotFlow tidak dikenali.')
  return normalizeProject(raw, true)
}

// ---------- CSV ----------
const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`

export function exportCsv(p: Project): Promise<boolean> {
  const head = ['Scene', 'Shot', 'Shot Size', 'Camera Angle', 'Movement', 'Lens', 'Lighting/Mood', 'Audio/Dialogue', 'Catatan Visual', 'Durasi (detik)', 'Status']
  const rows = p.shots.map((s) => [pad(s.scene), pad(s.shot), s.size, s.angle, s.movement, s.lens, s.lighting, s.audio, s.notes, s.duration, s.status])
  const csv = '﻿' + [head, ...rows].map((r) => r.map(esc).join(',')).join('\r\n')
  return saveTextFile(`${safeName(p.name)}.csv`, csv, 'text/csv', 'CSV', 'csv')
}

// ---------- PDF / cetak ----------
export async function printPdf(name: string): Promise<boolean> {
  if (window.shotflow) return window.shotflow.exportPdf(`${safeName(name)}.pdf`)
  window.print()
  return true
}
