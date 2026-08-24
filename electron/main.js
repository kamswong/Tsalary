const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, shell } = require('electron')
const fs = require('fs')
const path = require('path')
const http = require('http')

const isDev = !app.isPackaged
const userData = app.getPath('userData')
const configPath = path.join(userData, 'tsalary_config.json')

const DEFAULT_CONFIG = {
  monthly_salary: 8000,
  schedule: '双休',
  rest_days: 4,
  segments_text: '09:00-12:00\n13:00-18:00',
  insurance_amount_monthly: 0,
  allowances: [],
  show_currency_symbol: true,
  number_color: '',
  theme: 'dark',
  topmost: true,
  title: 'Tsalary' // 悬浮窗标题，空=显示默认“Tsalary”
}

let config = null
let displayWin = null
let settingsWin = null
let serverPort = null
let tray = null
let quitting = false

function loadConfig() {
  try {
    if (fs.existsSync(configPath)) {
      config = Object.assign({}, DEFAULT_CONFIG, JSON.parse(fs.readFileSync(configPath, 'utf-8')))
    } else {
      config = Object.assign({}, DEFAULT_CONFIG)
    }
  } catch (e) {
    config = Object.assign({}, DEFAULT_CONFIG)
  }
  return config
}

function saveConfigToFile(patch) {
  config = Object.assign({}, config, patch)
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
  } catch (e) {}
}

// 内置极简静态服务器，避免 file:// 下 ES Module 的 CORS 限制（dev/prod 一致）
const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.woff': 'font/woff', '.woff2': 'font/woff2'
}
function startServer() {
  const root = path.join(__dirname, '..', 'dist')
  const server = http.createServer((req, res) => {
    let urlPath = decodeURIComponent((req.url || '/').split('?')[0])
    if (urlPath === '/') urlPath = '/index.html'
    const filePath = path.join(root, urlPath)
    if (!filePath.startsWith(root)) { res.writeHead(403); return res.end() }
    fs.readFile(filePath, (err, data) => {
      if (err) { res.writeHead(404); return res.end('not found') }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream' })
      res.end(data)
    })
  })
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve(server.address().port))
  })
}

function urlFor(win) {
  if (isDev) return `http://localhost:5173/?win=${win}`
  return `http://127.0.0.1:${serverPort}/?win=${win}`
}

function appIcon() {
  try {
    const p = path.join(app.getAppPath(), 'assets', 'icon.png')
    return nativeImage.createFromPath(p)
  } catch (e) { return undefined }
}

function createDisplay() {
  displayWin = new BrowserWindow({
    width: 240,
    height: 52, // 默认仅数字的收起高度
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    alwaysOnTop: config.topmost !== false,
    skipTaskbar: true,
    resizable: false,
    show: false,
    icon: appIcon(),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })
  displayWin.loadURL(urlFor('display'))
  displayWin.setTitle(config.title ? config.title : 'Tsalary')
  displayWin.once('ready-to-show', () => displayWin.show())
  // X 关闭时收进托盘，而非退出（退出统一走托盘菜单）
  displayWin.on('close', (e) => {
    if (!quitting) { e.preventDefault(); displayWin.hide() }
  })
}

function createSettings() {
  if (settingsWin) { settingsWin.show(); settingsWin.focus(); return }
  settingsWin = new BrowserWindow({
    width: 640,
    height: 680,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    alwaysOnTop: false,
    resizable: false,
    show: false,
    icon: appIcon(),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })
  settingsWin.loadURL(urlFor('settings'))
  settingsWin.once('ready-to-show', () => settingsWin.show())
  settingsWin.on('closed', () => { settingsWin = null })
  // 页面内容高度变化时自适应调整设置窗口高度
  settingsWin.webContents.on('did-finish-load', () => {
    settingsWin.webContents.send('settings-ready')
  })
}

// 设置窗口随内容自适应高度（最小 320，最大 720，超出则窗口内滚动）
ipcMain.handle('resize-settings', (e, h) => {
  if (!settingsWin) return
  const height = Math.max(320, Math.min(720, Math.round(h)))
  settingsWin.setContentSize(640, height)
  return true
})
// 用系统默认浏览器打开外部链接
ipcMain.on('open-external', (e, url) => {
  if (typeof url === 'string' && /^https?:\/\//.test(url)) shell.openExternal(url)
})

// 系统托盘：始终常驻，右键菜单控制显示/设置/退出
function createTray() {
  let iconPath
  try {
    // 将内嵌图标写出为文件，规避 asar 内直接加载的兼容性差异
    const b64 = fs.readFileSync(path.join(app.getAppPath(), 'assets', 'icon.b64'), 'utf-8')
    iconPath = path.join(userData, 'tsalary_tray.png')
    fs.writeFileSync(iconPath, Buffer.from(b64, 'base64'))
  } catch (e) {
    iconPath = path.join(app.getAppPath(), 'assets', 'icon.png')
  }
  try {
    tray = new Tray(iconPath)
  } catch (e) {
    return
  }
  tray.setToolTip('Tsalary')
  const menu = Menu.buildFromTemplate([
    { label: '显示悬浮窗', click: () => displayWin && displayWin.show() },
    { label: '打开设置', click: () => createSettings() },
    { type: 'separator' },
    { label: '退出', click: () => app.quit() }
  ])
  tray.setContextMenu(menu)
  tray.on('click', () => {
    if (!displayWin) return
    if (displayWin.isVisible()) displayWin.hide()
    else displayWin.show()
  })
}

ipcMain.handle('get-config', () => config)
ipcMain.handle('save-config', (e, cfg) => {
  saveConfigToFile(cfg)
  if (displayWin) {
    displayWin.setTitle((config.title || '').trim() ? config.title : 'Tsalary')
    displayWin.webContents.send('config-updated', config)
  }
  return true
})
ipcMain.on('open-settings', () => createSettings())
ipcMain.handle('toggle-top', () => {
  if (!displayWin) return config.topmost
  const on = !displayWin.isAlwaysOnTop()
  displayWin.setAlwaysOnTop(on)
  saveConfigToFile({ topmost: on })
  return on
})
// X 按钮：收进托盘
ipcMain.on('close-display', () => { if (displayWin) displayWin.hide() })
// 悬浮窗高度随明细显示/隐藏动态调整
ipcMain.handle('resize-display', (e, h) => {
  if (displayWin) {
    const height = Math.max(44, Math.min(200, Math.round(h)))
    displayWin.setContentSize(240, height)
  }
  return true
})

// 数字纯悬浮态：支持鼠标拖拽移动窗口
let dragAnchor = null
ipcMain.on('begin-display-drag', () => {
  if (displayWin) dragAnchor = displayWin.getPosition()
})
ipcMain.on('move-display-drag', (e, dx, dy) => {
  if (displayWin && dragAnchor) {
    displayWin.setPosition(dragAnchor[0] + Math.round(dx), dragAnchor[1] + Math.round(dy))
  }
})
ipcMain.on('end-display-drag', () => { dragAnchor = null })

app.whenReady().then(async () => {
  loadConfig()
  if (!isDev) serverPort = await startServer()
  createDisplay()
  createTray()
})

app.on('before-quit', () => { quitting = true })
app.on('window-all-closed', () => {
  // 有托盘时即便窗口都关了也不自动退出，等待托盘退出
  if (process.platform !== 'darwin' && !tray) app.quit()
})
