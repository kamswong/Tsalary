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
  endDisplayDrag: () => ipcRenderer.send('end-display-drag'),
  // 真实拖动后退出右下角停靠（单击展开/收起不退出）
  releaseDock: () => ipcRenderer.send('display-dock-release'),
  // 开机自启动状态查询 / 开关
  autostartGet: () => ipcRenderer.invoke('autostart-get'),
  autostartSet: (on) => ipcRenderer.invoke('autostart-set', !!on)
})