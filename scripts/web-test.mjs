// Uji E2E versi web/PWA dengan emulasi iPad & desktop. Dijalankan di CI (Playwright + Chromium).
import { chromium } from 'playwright'
import fs from 'node:fs'

const URL = process.env.TEST_URL || 'http://localhost:4173/'
fs.mkdirSync('shots', { recursive: true })
let failed = 0
const ok = (cond, msg) => {
  if (cond) console.log('  ok  ', msg)
  else {
    failed++
    console.error('  FAIL', msg)
  }
}

const profiles = [
  ['ipad-portrait', { viewport: { width: 820, height: 1180 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 }, true],
  ['ipad-landscape', { viewport: { width: 1180, height: 820 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 }, true],
  ['ipad-pro-landscape', { viewport: { width: 1366, height: 1024 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 }, true],
  ['desktop', { viewport: { width: 1600, height: 900 } }, false],
]

const browser = await chromium.launch()

for (const [name, opts, compact] of profiles) {
  console.log(`\n== ${name} ==`)
  const ctx = await browser.newContext(opts)
  const page = await ctx.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e)))
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))

  try {
    await page.goto(URL)
    await page.waitForSelector('[draggable=true]', { timeout: 15000 })
    const cards = () => page.locator('main [draggable=true]').count()
    const n = await cards()
    ok(n >= 4, `kartu contoh tampil (${n})`)

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)
    ok(!overflow, 'tanpa scroll horizontal halaman')
    const headerFits = await page.evaluate(() => {
      const h = document.querySelector('header')
      return h.scrollWidth <= h.clientWidth + 1
    })
    ok(headerFits, 'topbar muat tanpa terpotong')
    await page.screenshot({ path: `shots/${name}-1-grid.png` })

    // Tambah shot lewat tombol di grid
    await page.locator('main button:has-text("Tambah shot")').click()
    await page.waitForTimeout(300)
    ok((await cards()) === n + 1, 'tambah shot -> jumlah kartu +1')

    // Inspector: terbuka otomatis di layar ringkas, permanen di desktop
    await page.waitForSelector('text=Status Syuting', { timeout: 5000 })
    ok(true, compact ? 'inspector terbuka sebagai panel geser' : 'inspector tampil di panel kanan')
    await page.screenshot({ path: `shots/${name}-2-inspector.png` })

    // Status shot -> badge muncul di kartu
    await page.getByRole('button', { name: 'Pick', exact: true }).click()
    await page.waitForTimeout(200)
    ok((await page.locator('main span:text-is("Pick")').count()) >= 1, 'status Pick tampil di kartu')

    // Geser urutan dengan tombol (pengganti drag di layar sentuh)
    const idxOf = () => page.evaluate(() => Array.from(document.querySelectorAll('main [draggable=true]')).findIndex((c) => c.textContent.includes('Pick')))
    const before = await idxOf()
    await page.getByRole('button', { name: 'Geser ke kiri' }).click()
    await page.waitForTimeout(200)
    const after = await idxOf()
    ok(after === before - 1, `geser ke kiri (${before} -> ${after})`)

    // Sketsa: gambar garis dengan pointer, simpan, pastikan vektor muncul di kartu
    await page.locator('aside button:has-text("Sketsa")').first().click()
    const pad = page.locator('.cursor-crosshair')
    await pad.waitFor({ timeout: 5000 })
    const box = await pad.boundingBox()
    await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.3)
    await page.mouse.down()
    await page.mouse.move(box.x + box.width * 0.6, box.y + box.height * 0.5, { steps: 8 })
    await page.mouse.up()
    await page.screenshot({ path: `shots/${name}-3-sketch.png` })
    await page.getByRole('button', { name: 'Selesai' }).click()
    await page.waitForTimeout(300)
    ok((await page.locator('main svg[viewBox^="0 0 1000"] path').count()) >= 1, 'sketsa tersimpan & tampil di kartu')

    if (compact) {
      await page.getByRole('button', { name: 'Tutup panel' }).click()
      await page.waitForTimeout(200)
      ok((await page.locator('text=Status Syuting').count()) === 0, 'panel inspector bisa ditutup')
      // Ketuk kartu -> inspector terbuka lagi
      await page.locator('main [draggable=true]').first().click()
      await page.waitForSelector('text=Status Syuting', { timeout: 3000 })
      ok(true, 'ketuk kartu membuka inspector')
      await page.getByRole('button', { name: 'Tutup panel' }).click()
    }

    // Persistensi (IndexedDB): muat ulang, data harus tetap ada
    await page.waitForTimeout(1200)
    await page.reload()
    await page.waitForSelector('[draggable=true]')
    ok((await cards()) === n + 1, 'data bertahan setelah reload (IndexedDB)')
    ok((await page.locator('main span:text-is("Pick")').count()) >= 1, 'status bertahan setelah reload')
    await page.screenshot({ path: `shots/${name}-4-after-reload.png` })

    // PWA: manifest, service worker, offline (satu profil cukup)
    if (name === 'ipad-portrait') {
      const m = await page.evaluate(async () => {
        const link = document.querySelector('link[rel=manifest]')
        const r = await fetch(link.href)
        return { status: r.status, json: await r.json(), apple: !!document.querySelector('link[rel=apple-touch-icon]') }
      })
      ok(m.status === 200 && m.json.display === 'standalone' && m.json.icons.length >= 3, 'manifest valid (standalone + ikon)')
      ok(m.apple, 'apple-touch-icon terpasang')
      await page.evaluate(() =>
        Promise.race([navigator.serviceWorker.ready, new Promise((_, rej) => setTimeout(() => rej(new Error('service worker tidak aktif dalam 15 dtk')), 15000))]),
      )
      const cached = await page.evaluate(async () => {
        const keys = await caches.keys()
        const c = await caches.open(keys[0])
        return { keys, n: (await c.keys()).length }
      })
      ok(cached.keys.includes('shotflow-v1') && cached.n >= 8, `service worker mem-cache aset (${cached.n} entri)`)
      await page.reload() // sekarang dikontrol SW
      await page.waitForSelector('[draggable=true]')
      await ctx.setOffline(true)
      await page.reload()
      await page.waitForSelector('[draggable=true]', { timeout: 10000 })
      ok(true, 'aplikasi terbuka saat offline')
      await page.screenshot({ path: `shots/${name}-5-offline.png` })
      await ctx.setOffline(false)
    }

    ok(errors.length === 0, `tanpa galat console/page${errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''}`)
  } catch (e) {
    failed++
    console.error('  FAIL pengecualian:', String(e).split('\n')[0])
    await page.screenshot({ path: `shots/${name}-error.png` }).catch(() => {})
  }
  await ctx.close()
}

await browser.close()
console.log(failed ? `\nWEB TEST: ${failed} gagal` : '\nWEB TEST OK')
process.exit(failed ? 1 : 0)
