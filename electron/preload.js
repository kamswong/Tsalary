const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
  getConfig: () => ipcRenderer.invoke('get-config'),
  saveConfig: (cfg) => ipcRenderer.invoke('save-config', cfg),
  onConfig: (cb) => ipcRenderer.on('config-updated', (_e, cfg) => cb(cfg)),
  openSettings: () => ipcRenderer.send('open-settings'),
  toggleTop: () => ipcRenderer.invoke('toggle-top'),
  closeDisplay: () => ipcRenderer.send('close-display'),
  resizeDisplay: (h) => ipcRenderer.invoke('resize-display', h),
  resizeSettings: (h) => ipcRenderer.invoke('resize-settings', h),
  onSettingsReady: (cb) => ipcRenderer.on('settings-ready', () => cb()),
  openExternal: (url) => ipcRenderer.send('open-external', url),
  beginDisplayDrag: () => ipcRenderer.send('begin-display-drag'),
  moveDisplayDrag: (dx, dy) => ipcRenderer.send('move-display-drag', dx, dy),
  endDisplayDrag: () => ipcRenderer.send('end-display-drag')
})
