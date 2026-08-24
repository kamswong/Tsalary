// 生成 Tsalary 黑白灰沙漏图标：assets/icon.png / icon.b64 / icon.ico
// 用法：node tools/gen-icons.js
const fs = require('fs')
const path = require('path')
const zlib = require('zlib')

// ---------- 基础像素光栅：超采样抗锯齿 ----------
const SUP = 4 // 超采样倍数

// 黑色底 + 白色 沙漏线稿 + 白 ¥ + 灰角落刻度（黑白灰）
const C_BG = { r: 9, g: 10, b: 13 }
const C_WHITE = { r: 255, g: 255, b: 255 }
const C_GRAY = { r: 154, g: 160, b: 170 }

// 归一化几何（0..1，左上原点）
const R = { x0: 0.05, y0: 0.05, x1: 0.95, y1: 0.95, rad: 0.17 } // 圆角方
// 沙漏两个三角形（描边）
const triTop = [[0.283, 0.25], [0.717, 0.25], [0.5, 0.467]]
const triBot = [[0.283, 0.75], [0.717, 0.75], [0.5, 0.533]]
// ¥ 笔画：横线 / 竖线 / 两条斜线
const yBar = [[0.37, 0.38], [0.63, 0.38]]
const yStem = [[0.5, 0.38], [0.5, 0.62]]
const yDiagL = [[0.37, 0.46], [0.55, 0.7]]
const yDiagR = [[0.63, 0.46], [0.45, 0.7]]
const STROKE = 0.048
const TICK = [[0.17, 0.2], [0.83, 0.2], [0.17, 0.8], [0.83, 0.8]]
const TICK_R = 0.026

function dist2seg(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay
  const len2 = dx * dx + dy * dy
  let t = len2 ? ((px - ax) * dx + (py - ay) * dy) / len2 : 0
  t = Math.max(0, Math.min(1, t))
  const cx = ax + dx * t, cy = ay + dy * t
  return Math.hypot(px - cx, py - cy)
}

function insideTriangle(px, py, a, b, c) {
  const s = (ax, ay, bx, by, px2, py2) => (px2 - bx) * (ay - by) - (ax - bx) * (py2 - by)
  const d1 = s(a[0], a[1], b[0], b[1], px, py)
  const d2 = s(b[0], b[1], c[0], c[1], px, py)
  const d3 = s(c[0], c[1], a[0], a[1], px, py)
  const hasNeg = d1 < 0 || d2 < 0 || d3 < 0
  const hasPos = d1 > 0 || d2 > 0 || d3 > 0
  return !(hasNeg && hasPos)
}

function insideRoundRect(px, py) {
  const { x0, y0, x1, y1, rad } = R
  const cx = Math.max(x0, Math.min(x1, px))
  const cy = Math.max(y0, Math.min(y1, py))
  const dx = px - cx, dy = py - cy
  if (dx === 0 || dy === 0) return true
  return Math.hypot(dx, dy) <= rad
}

// 渲染单尺寸，返回 RGBA Uint8ClampedArray
function render(size) {
  const S = size * SUP
  // white 覆盖率缓冲（uint8，0..SUP*SUP）；bgAlpha 累加缓冲
  const whiteBuf = new Float32Array(S * S)
  const bgBuf = new Float32Array(S * S)
  const px = (v) => v * S

  function markSeg(ax, ay, bx, by) {
    ax = px(ax); ay = px(ay); bx = px(bx); by = px(by)
    const t = STROKE * S * 0.5
    const minX = Math.max(0, Math.floor(Math.min(ax, bx) - t))
    const maxX = Math.min(S - 1, Math.ceil(Math.max(ax, bx) + t))
    const minY = Math.max(0, Math.floor(Math.min(ay, by) - t))
    const maxY = Math.min(S - 1, Math.ceil(Math.max(ay, by) + t))
    for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) {
      if (dist2seg(x + 0.5, y + 0.5, ax, ay, bx, by) <= t) whiteBuf[y * S + x] = 1
    }
  }
  function markTri(tri) {
    const a = [px(tri[0][0]), px(tri[0][1])]
    const b = [px(tri[1][0]), px(tri[1][1])]
    const c = [px(tri[2][0]), px(tri[2][1])]
    const t = STROKE * S * 0.5
    const minX = Math.max(0, Math.floor(Math.min(a[0], b[0], c[0]) - t))
    const maxX = Math.min(S - 1, Math.ceil(Math.max(a[0], b[0], c[0]) + t))
    const minY = Math.max(0, Math.floor(Math.min(a[1], b[1], c[1]) - t))
    const maxY = Math.min(S - 1, Math.ceil(Math.max(a[1], b[1], c[1]) + t))
    for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) {
      const cx = x + 0.5, cy = y + 0.5
      const edge = Math.min(
        dist2seg(cx, cy, a[0], a[1], b[0], b[1]),
        dist2seg(cx, cy, b[0], b[1], c[0], c[1]),
        dist2seg(cx, cy, c[0], c[1], a[0], a[1])
      ) <= t && insideTriangle(cx, cy, a, b, c)
      if (edge) whiteBuf[y * S + x] = 1
    }
  }
  function markCircle(cx, cy, r) {
    cx = px(cx); cy = px(cy); r = r * S
    const minX = Math.max(0, Math.floor(cx - r)), maxX = Math.min(S - 1, Math.ceil(cx + r))
    const minY = Math.max(0, Math.floor(cy - r)), maxY = Math.min(S - 1, Math.ceil(cy + r))
    for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) {
      if (Math.hypot(x + 0.5 - cx, y + 0.5 - cy) <= r) bgBuf[y * S + x] = 1 // 刻度用黑(靠 bgAlpha 占位避免留白)
    }
  }

  // 底：圆角方（黑色）
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    if (insideRoundRect((x + 0.5) / S, (y + 0.5) / S)) bgBuf[y * S + x] = 1
  }
  // 沙漏两三角 + ¥ 笔画（白色）
  markTri(triTop); markTri(triBot)
  markSeg(...yBar[0], ...yBar[1])
  markSeg(...yStem[0], ...yStem[1])
  markSeg(...yDiagL[0], ...yDiagL[1])
  markSeg(...yDiagR[0], ...yDiagR[1])
  // 角落刻度：覆盖为灰色
  // 先描圆（写入 bgBuf 作为占位），再在 final 用灰色

  // 汇总：把 roundrect 内的白标记保留；刻度圆区域置灰
  const fine = new Uint8ClampedArray(size * size * 4)
  const half = SUP * SUP
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    let wSum = 0, bSum = 0
    for (let sy = 0; sy < SUP; sy++) for (let sx = 0; sx < SUP; sx++) {
      const idx = (y * SUP + sy) * S + (x * SUP + sx)
      if (whiteBuf[idx] > 0) wSum++
      if (bgBuf[idx] > 0) bSum++
    }
    const alpha = bSum / half
    let col = C_BG
    if (wSum / half > 0.25) col = C_WHITE
    // 刻度（灰）覆盖
    for (const [tx, ty] of TICK) {
      const dx = (x + 0.5) / size - tx, dy = (y + 0.5) / size - ty
      if (Math.hypot(dx, dy) <= TICK_R) { col = C_GRAY; break }
    }
    const i = (y * size + x) * 4
    fine[i] = Math.round(col.r)
    fine[i + 1] = Math.round(col.g)
    fine[i + 2] = Math.round(col.b)
    fine[i + 3] = Math.round(alpha * 255)
  }
  return fine
}

// ---------- PNG 编码（RGBA，无压缩器内置 deflate 用 zlib） ----------
function crc32(buf) {
  let c, table = crc32.table
  if (!table) {
    table = crc32.table = new Int32Array(256)
    for (let n = 0; n < 256; n++) {
      c = n
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
      table[n] = c
    }
  }
  c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
  const t = Buffer.from(type, 'ascii')
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])))
  return Buffer.concat([len, t, data, crc])
}
function encodePNG(rgba, w, h) {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4)
  ihdr[8] = 8; ihdr[9] = 6 // 8bit, RGBA
  const raw = Buffer.alloc((w * 4 + 1) * h)
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0 // filter none
    raw.set(rgba.subarray(y * w * 4, (y + 1) * w * 4), y * (w * 4 + 1) + 1)
  }
  const idat = zlib.deflateSync(raw, { level: 9 })
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))
  ])
}

// ---------- ICO 组装（内嵌 PNG） ----------
function buildIco(pngs) {
  const count = pngs.length
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(count, 4)
  const entries = []
  const datas = []
  let offset = 6 + count * 16
  for (let i = 0; i < count; i++) {
    const { size, png } = pngs[i]
    const e = Buffer.alloc(16)
    e[0] = size >= 256 ? 0 : size
    e[1] = size >= 256 ? 0 : size
    e.writeUInt16LE(1, 4)   // planes
    e.writeUInt16LE(32, 6)  // bitcount
    e.writeUInt32LE(png.length, 8)
    e.writeUInt32LE(offset, 12)
    entries.push(e); datas.push(png)
    offset += png.length
  }
  return Buffer.concat([header, ...entries, ...datas])
}

// ---------- 输出 ----------
const outDir = path.join(__dirname, '..', 'assets')
const srcDir = path.join(__dirname, '..', 'src', 'assets')
const sizes = [256, 128, 64, 48, 32, 16]
const pngs = sizes.map((s) => ({ size: s, png: encodePNG(render(s), s, s) }))

const png256 = pngs.find((p) => p.size === 256).png
fs.writeFileSync(path.join(outDir, 'icon.png'), png256)

// 供 Vue 组件引用的版本（设置窗口/悬浮窗标题前的 logo）
const png64 = pngs.find((p) => p.size === 64).png
if (!fs.existsSync(srcDir)) fs.mkdirSync(srcDir, { recursive: true })
fs.writeFileSync(path.join(srcDir, 'icon.png'), png64)

const png32 = pngs.find((p) => p.size === 32).png
fs.writeFileSync(path.join(outDir, 'icon.b64'), png32.toString('base64'))

const ico = buildIco(pngs)
fs.writeFileSync(path.join(outDir, 'icon.ico'), ico)

console.log('generated assets/icon.png, icon.b64, icon.ico')
console.log('png256 bytes=', png256.length, ' ico bytes=', ico.length)