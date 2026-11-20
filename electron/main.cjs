const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron')
const path = require('path')
const fs = require('fs/promises')

const DEV_URL = process.env.VITE_DEV_SERVER_URL
const dataFile = () => path.join(app.getPath('userData'), 'shotflow-data.json')

let backedUp = false

async function atomicWrite(file, content) {
  const tmp = file + '.tmp'
  await fs.writeFile(tmp, content, typeof content === 'string' ? 'utf8' : undefined)
  await fs.rename(tmp, file)
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1480,
    height: 920,
    minWidth: 1100,
    minHeight: 680,
    show: false,
    title: 'ShotFlow',
    backgroundColor: '#15171b',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  win.once('ready-to-show', () => win.show())

  // Link eksternal dibuka di browser default, bukan di jendela app.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//.test(url)) shell.openExternal(url)
    return { action: 'deny' }
  })
  win.webContents.on('will-navigate', (e, url) => {
    if (DEV_URL ? !url.startsWith(DEV_URL) : !url.startsWith('file://')) e.preventDefault()
  })

  if (DEV_URL) {
    win.loadURL(DEV_URL)
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }
}

// ---------- IPC: penyimpanan lokal ----------
ipcMain.handle('data:load', async () => {
  try {
    return await fs.readFile(dataFile(), 'utf8')
  } catch {
    return null
  }
})

ipcMain.handle('data:save', async (_e, json) => {
  try {
    const file = dataFile()
    if (!backedUp) {
      backedUp = true
      await fs.copyFile(file, file + '.bak').catch(() => {})
    }
    await atomicWrite(file, json)
    return true
  } catch (err) {
    console.error('save failed', err)
    return false
  }
})

// ---------- IPC: ekspor / impor file ----------
ipcMain.handle('file:save', async (e, { defaultName, filters, data }) => {
  const win = BrowserWindow.fromWebContents(e.sender)
  const res = await dialog.showSaveDialog(win, { defaultPath: defaultName, filters })
  if (res.canceled || !res.filePath) return false
  await fs.writeFile(res.filePath, data, 'utf8')
  return true
})

ipcMain.handle('file:open', async (e, { filters }) => {
  const win = BrowserWindow.fromWebContents(e.sender)
  const res = await dialog.showOpenDialog(win, { properties: ['openFile'], filters })
  if (res.canceled || !res.filePaths[0]) return null
  const data = await fs.readFile(res.filePaths[0], 'utf8')
  return { name: path.basename(res.filePaths[0]), data }
})

ipcMain.handle('export:pdf', async (e, defaultName) => {
  const win = BrowserWindow.fromWebContents(e.sender)
  const pdf = await win.webContents.printToPDF({
    preferCSSPageSize: true, // ukuran & orientasi halaman diambil dari @page di PrintView
    printBackground: true,
  })
  const res = await dialog.showSaveDialog(win, {
    defaultPath: defaultName,
    filters: [{ name: 'PDF', extensions: ['pdf'] }],
  })
  if (res.canceled || !res.filePath) return false
  await fs.writeFile(res.filePath, pdf)
  return true
})

// ---------- lifecycle ----------
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    const [win] = BrowserWindow.getAllWindows()
    if (win) {
      if (win.isMinimized()) win.restore()
      win.focus()
    }
  })
  app.whenReady().then(() => {
    createWindow()
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  })
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })
}
