# ShotFlow — Storyboard Video Desktop App

Aplikasi desktop ringan untuk menyusun storyboard video secara offline.
Stack: **Electron + React 18 + TypeScript + Vite + Tailwind CSS + Zustand**.

## Cara tercepat membuat file .exe (Windows)

1. Pasang **Node.js LTS** dari https://nodejs.org (sekali saja).
2. Ekstrak zip ini, lalu **klik dua kali `BUILD-WINDOWS.bat`**.
3. Tunggu beberapa menit. Folder `release` terbuka otomatis berisi:
   - `ShotFlow Setup x.y.z.exe` → installer (shortcut desktop + Start Menu)
   - `ShotFlow x.y.z.exe` → versi portable, tanpa install

Alternatif tanpa Node di PC: unggah folder ini ke repo GitHub, buka tab **Actions → Build installers → Run workflow**, lalu unduh `.exe` dari bagian Artifacts.

Catatan: installer belum ditandatangani (code signing), jadi Windows SmartScreen bisa menampilkan "Windows protected your PC". Klik **More info → Run anyway**. Untuk menghilangkannya perlu sertifikat code signing berbayar.

## Versi iPad / browser (PWA)

Alamat: `https://panduansku.github.io/videografe/` (aktif setelah GitHub Pages diaktifkan, lihat di bawah).

Pasang di iPad: buka alamat itu di **Safari** → tombol **Bagikan** → **Tambah ke Layar Utama**. Setelah itu ShotFlow terbuka seperti aplikasi biasa (layar penuh) dan tetap bisa dipakai **offline**.

- Data tersimpan di IndexedDB perangkat (tanpa batas 5 MB localStorage). Backup dan pindah ke PC: **Ekspor JSON** di iPad, lalu **Impor JSON** di PC (atau sebaliknya).
- Tata letak ringkas: ketuk kartu untuk membuka panel detail; geser urutan dengan tombol ◀ ▶ di panel (atau Alt+←/→).
- Sketsa bisa memakai jari atau Apple Pencil. PDF: Ekspor → Cetak, lalu Bagikan → Simpan ke Berkas.
- Data di iPad terpisah dari data di PC.

Aktifkan hosting sekali saja: repo → **Settings → Pages → Build and deployment → Source: GitHub Actions**, lalu **Actions → Build installers → Run workflow**.

## Keamanan (sudah diterapkan)

- `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`; renderer hanya mengakses 5 fungsi di `window.shotflow`.
- Content-Security-Policy ketat pada build produksi (tanpa skrip eksternal, tanpa koneksi jaringan).
- Aplikasi tidak melakukan permintaan jaringan apa pun; semua data lokal.
- Navigasi dan jendela baru diblokir; tautan http(s) dibuka di browser default.
- Data impor JSON divalidasi dan dibersihkan (`normalizeProject`), hanya gambar `data:image/` yang diterima.
- Penulisan data atomik (file sementara lalu rename) + cadangan `.bak`.

## Struktur Folder

```
shotflow/
├── package.json              # skrip dev/build + konfigurasi electron-builder
├── vite.config.ts            # base './' agar jalan dari file:// di Electron
├── tailwind.config.cjs       # palet charcoal + aksen amber/cyan
├── postcss.config.cjs
├── tsconfig.json
├── index.html
├── electron/
│   ├── main.cjs              # proses utama: jendela, simpan data, dialog file, PDF
│   └── preload.cjs           # jembatan aman window.shotflow (contextIsolation)
└── src/
    ├── main.tsx              # bootstrap + autosave debounced 500 ms
    ├── App.tsx               # layout 3 panel, shortcut, paste gambar
    ├── store.ts              # state (Zustand): proyek, shot, urutan, UI
    ├── types.ts / constants.ts / global.d.ts
    ├── index.css             # tema + stylesheet cetak (@media print)
    ├── lib/
    │   ├── project.ts        # factory, penomoran otomatis, normalisasi impor
    │   ├── io.ts             # simpan/muat, JSON, CSV, PDF
    │   ├── image.ts          # kompres gambar (maks 1600px JPEG)
    │   └── strokes.tsx       # render sketsa vektor (SVG)
    └── components/
        ├── Topbar.tsx        # proyek, aspect ratio, fps, lensa, statistik, ekspor
        ├── ShotGrid.tsx      # grid + drag & drop urutan
        ├── ShotCard.tsx      # kartu shot
        ├── Inspector.tsx     # panel editor shot (kanan)
        ├── SketchEditor.tsx  # kanvas sketsa/anotasi (panah, garis, coretan)
        ├── PrintView.tsx     # layout PDF (tema terang)
        ├── Frame.tsx, Popover.tsx, Icon.tsx
```

## Menjalankan (mode pengembangan)

Prasyarat: **Node.js 18+** (disarankan 20/22) dan npm.

```bash
cd shotflow
npm install
npm run dev        # Vite + jendela Electron dengan hot reload
```

Hanya UI di browser (tanpa Electron, data di localStorage): `npm run dev:web`.

## Build menjadi installer

Build dilakukan di OS targetnya (Windows → .exe, macOS → .dmg, Linux → .AppImage).

```bash
npm run dist:win     # release/ShotFlow Setup x.y.z.exe   (NSIS)
npm run dist:mac     # release/ShotFlow-x.y.z.dmg
npm run dist:linux   # release/ShotFlow-x.y.z.AppImage
```

Untuk ikon kustom, buat folder `build/` berisi `icon.ico` (Windows), `icon.icns` (macOS), `icon.png` 512x512 (Linux).

## Tempat data tersimpan

File `shotflow-data.json` di folder data aplikasi (`%APPDATA%/ShotFlow`, `~/Library/Application Support/ShotFlow`, `~/.config/ShotFlow`). Ditulis atomik, plus cadangan `.bak` per sesi. Gambar disimpan terkompresi di dalam file ini.

## Fitur MVP

- Proyek: buat, ganti, duplikasi, hapus; aspect ratio (16:9, 9:16, 2.39:1, 4:3, 1:1), fps (24/30/60/120), lensa default.
- Grid kartu dengan drag & drop, penomoran otomatis `SC-01 / SH-01`, sisipkan shot di tengah urutan.
- Inspector: gambar dari unggah / Ctrl+V / drag file, sketsa vektor, Shot Size, Angle, Movement, Lens, Lighting, Audio, Catatan, Durasi.
- Total durasi, jumlah shot dan scene di topbar.
- Ekspor: PDF (3 layout halaman), JSON proyek (+impor), CSV shot list.

## Shortcut

`Ctrl/Cmd+V` tempel gambar · `N` shot baru · `Ctrl/Cmd+D` duplikat · `Del` hapus · `←/→` pilih shot · `Enter` buka sketsa.

## Tauri vs Electron

| | Electron (dipakai) | Tauri |
|---|---|---|
| Ukuran installer | ~80–100 MB | ~5–15 MB |
| RAM | lebih tinggi | lebih rendah |
| Butuh | Node saja | Rust toolchain |
| Rendering | Chromium identik di semua OS | WebView bawaan OS (bisa beda) |
| PDF | `printToPDF` bawaan | perlu plugin/cetak sistem |

Lapisan `src/lib/io.ts` hanya memakai `window.shotflow`, jadi migrasi ke Tauri cukup mengganti implementasi 5 fungsi itu dengan `invoke(...)`.
