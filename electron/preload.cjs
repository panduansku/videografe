const { contextBridge, ipcRenderer } = require('electron')

// API minimal & aman yang diekspos ke renderer (window.shotflow).
contextBridge.exposeInMainWorld('shotflow', {
  load: () => ipcRenderer.invoke('data:load'),
  save: (json) => ipcRenderer.invoke('data:save', json),
  saveFile: (opts) => ipcRenderer.invoke('file:save', opts),
  openFile: (opts) => ipcRenderer.invoke('file:open', opts),
  exportPdf: (defaultName) => ipcRenderer.invoke('export:pdf', defaultName),
})
