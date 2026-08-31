const { contextBridge, ipcRenderer } = require('electron')

// 高度参数消毒：undefined/NaN 一律回退为收起高度，避免 IPC 序列化崩溃
const _h = (h) => (typeof h === 'number' && Number.isFinite(h) ? h : 48)

contextBridge.exposeInMainWorld('api', {
  getConfig: () => ipcRenderer.invoke('get-config'),
  saveConfig: (cfg) => ipcRenderer.invoke('save-config', cfg),
  onConfig: (cb) => ipcRenderer.on('config-updated', (_e, cfg) => cb(cfg)),
  openSettings: () => ipcRenderer.send('open-settings'),
  toggleTop: () => ipcRenderer.invoke('toggle-top'),
  closeDisplay: () => ipcRenderer.send('close-display'),
  resizeDisplay: (h) => ipcRenderer.invoke('resize-display', _h(h)),
  resizeSettings: (h) => ipcRenderer.invoke('resize-settings', _h(h)),
  onSettingsReady: (cb) => ipcRenderer.on('settings-ready', () => cb()),
  openExternal: (url) => ipcRenderer.send('open-external', url),
  beginDisplayDrag: () => ipcRenderer.send('begin-display-drag'),
  moveDisplayDrag: () => ipcRenderer.send('move-display-drag'),
  endDisplayDrag: () => ipcRenderer.send('end-display-drag')
})