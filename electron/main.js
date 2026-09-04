const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, shell, screen } = require('electron')
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
  currency_symbol: '¥', // 货币符号，空字符串表示不显示
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

// 单实例锁：避免“开机自启动 + 手动双击/再次运行”并存，导致两个进程双份计时
// （便携版每次运行都会解压出独立临时副本，多实例 = 工资翻倍计时，必须锁住）
const gotSingleLock = app.requestSingleInstanceLock()
if (!gotSingleLock) {
  app.quit()
}

function migrateConfig(cfg) {
  // 旧版本(≤1.x.x)：show_currency_symbol(布尔) → currency_symbol(字符串)
  if (cfg && cfg.currency_symbol == null && 'show_currency_symbol' in cfg) {
    cfg.currency_symbol = cfg.show_currency_symbol === false ? '' : '¥'
  }
  return cfg
}

function loadConfig() {
  try {
    if (fs.existsSync(configPath)) {
      config = Object.assign({}, DEFAULT_CONFIG, migrateConfig(JSON.parse(fs.readFileSync(configPath, 'utf-8'))))
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

// 悬浮窗停靠位（DIP）：默认贴“光标所在屏”的右下角工作区，离右/下边距 16px。
// 处于停靠位时窗口高度变化保持“右边缘与底边不动、向上生长”，
// 避免展开明细后被任务栏截断；用户真实拖走窗口后退出停靠模式。
let displayDock = null
let displayDocked = false

function displayDockRect() {
  const wa = screen.getDisplayNearestPoint(screen.getCursorScreenPoint()).workArea
  return { x: wa.x + wa.width - 240 - 16, bottom: wa.y + wa.height - 16 }
}

function createDisplay() {
  const dock = displayDockRect()
  const h0 = 52 // 默认仅数字的收起高度
  displayWin = new BrowserWindow({
    width: 240,
    height: h0,
    x: dock.x,
    y: dock.bottom - h0, // 创建即停靠右下角，避免先居中再跳位
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    // Windows 上 frameless 窗口默认带 WS_THICKFRAME，系统会为它绘制标准窗口框 + DWM 阴影。
    // 窗口本身透明时，这层矩形灰框会从 CSS 圆角外透出，形成四角"灰色直角"。关掉即可。
    thickFrame: false,
    hasShadow: false,
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
  displayDock = dock
  displayDocked = true
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
    height: 720,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    // 同悬浮窗：关掉 WS_THICKFRAME 系统窗口框，消除圆角外的灰色直角
    thickFrame: false,
    hasShadow: false,
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

// 设置窗口随内容自适应高度（最小 320，最大 1000；窗口高度 = 内容高度，窗口内不滚动）
ipcMain.handle('resize-settings', (e, h) => {
  if (!settingsWin) return false
  const n = typeof h === 'number' && Number.isFinite(h) ? h : 500
  const height = Math.max(320, Math.min(1000, Math.round(n)))
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
  if (!displayWin) return false
  // 强制类型消毒：只接受合法有限的数字，否则一律兜底为收起高度
  const n = typeof h === 'number' && Number.isFinite(h) ? h : 48
  const height = Math.max(44, Math.min(200, Math.round(n)))
  if (displayDocked && displayDock) {
    // 停靠右下角：右边缘固定，底边不动、向上生长
    displayWin.setBounds({ x: displayDock.x, y: displayDock.bottom - height, width: 240, height })
  } else {
    displayWin.setContentSize(240, height)
  }
  return true
})

// 数字纯悬浮态：支持鼠标拖拽移动窗口
// 关键点：
// 1) Electron 的 getCursorScreenPoint/getBounds/setBounds 全部使用 DIP（逻辑像素），
//    不要再除以 scaleFactor 做二次换算，否则缩放≠100% 时移动速度与鼠标不一致、抓取点漂移。
// 2) 每帧用 setBounds 显式钉死 width/height：对无边框透明窗口反复 setPosition 时，
//    Windows 的 DWM/边框处理可能造成尺寸漂移（窗口越拖越高），固定 bounds 彻底杜绝。
let dragGrab = null
ipcMain.on('begin-display-drag', () => {
  if (!displayWin) return
  const c = screen.getCursorScreenPoint()
  const b = displayWin.getBounds()
  dragGrab = {
    sx: c.x, sy: c.y,           // 起始光标 (DIP)
    wx: b.x, wy: b.y,           // 起始窗口位置
    w: b.width, h: b.height     // 起始窗口尺寸（拖动期间钉死）
  }
})
ipcMain.on('move-display-drag', () => {
  if (displayWin && dragGrab) {
    const c = screen.getCursorScreenPoint()
    const x = Math.round(dragGrab.wx + c.x - dragGrab.sx)
    const y = Math.round(dragGrab.wy + c.y - dragGrab.sy)
    displayWin.setBounds({ x, y, width: dragGrab.w, height: dragGrab.h })
  }
})
ipcMain.on('end-display-drag', () => { dragGrab = null })
// 用户把窗口真实拖走（移动超过阈值）后退出右下角停靠模式；单击展开/收起不会触发
ipcMain.on('display-dock-release', () => { displayDocked = false })

// ---- 开机自启动（Windows）----
// 便携版：进程本体运行在 NSIS 解压出的临时目录（process.execPath 每次可能不同），
// 但打包模板会把用户“真正双击的那个 exe”路径注入 PORTABLE_EXECUTABLE_FILE。
// 注册表 Run 项必须指向该真实路径，若写临时路径，重启后即失效。
function autostartExe() {
  return process.env.PORTABLE_EXECUTABLE_FILE || process.execPath
}
ipcMain.handle('autostart-get', () => {
  if (isDev) return { available: false, enabled: false }
  try {
    const s = app.getLoginItemSettings({ path: autostartExe() })
    return { available: true, enabled: !!(s && s.openAtLogin) }
  } catch (e) {
    return { available: true, enabled: false }
  }
})
ipcMain.handle('autostart-set', (e, on) => {
  if (isDev) return { available: false, enabled: false }
  try {
    app.setLoginItemSettings({ openAtLogin: !!on, path: autostartExe() })
    const s = app.getLoginItemSettings({ path: autostartExe() })
    return { available: true, enabled: !!(s && s.openAtLogin) }
  } catch (err) {
    return { available: true, enabled: false }
  }
})

// 第二次启动（手动双击 / 再次运行便携版）：唤起已存在的悬浮窗，不再新建进程
app.on('second-instance', () => {
  if (!displayWin) return
  if (displayWin.isVisible()) displayWin.focus()
  else displayWin.show()
})

if (gotSingleLock) {
  app.whenReady().then(async () => {
    loadConfig()
    if (!isDev) serverPort = await startServer()
    createDisplay()
    createTray()
  })
}

app.on('before-quit', () => { quitting = true })
app.on('window-all-closed', () => {
  // 有托盘时即便窗口都关了也不自动退出，等待托盘退出
  if (process.platform !== 'darwin' && !tray) app.quit()
})

// 全局未捕获异常：写入日志文件，不弹窗，便于后续排查真实根因
// 用 process.on 才能实际拦截 Node/Electron 默认的错误弹窗；app.on 不会生效。
process.on('uncaughtException', (err) => {
  try {
    const logPath = path.join(userData, 'crash.log')
    const msg = `[${new Date().toISOString()}] ${err && err.stack ? err.stack : err}\n\n`
    fs.appendFileSync(logPath, msg)
  } catch (_) {}
})
process.on('unhandledRejection', (reason) => {
  try {
    const logPath = path.join(userData, 'crash.log')
    const msg = `[${new Date().toISOString()}] unhandledRejection: ${reason && reason.stack ? reason.stack : reason}\n\n`
    fs.appendFileSync(logPath, msg)
  } catch (_) {}
})
