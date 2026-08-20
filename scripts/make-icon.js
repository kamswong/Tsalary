// 生成托盘/EXE 图标：64x64 绿色圆形（透明背景），输出 assets/icon.png、icon.b64、icon.ico
const fs = require('fs')
const zlib = require('zlib')
const path = require('path')

const SIZE = 256

// CRC32（PNG 需要）
const crcTable = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()
function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const t = Buffer.from(type, 'ascii')
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0)
  return Buffer.concat([len, t, data, crc])
}

// 画一个绿色实心圆（带 1px 半透明描边），其余透明
function draw(x, y) {
  const cx = SIZE / 2, cy = SIZE / 2
  const dx = x - cx + 0.5, dy = y - cy + 0.5
  const d = Math.sqrt(dx * dx + dy * dy)
  const r = SIZE / 2 - 4
  if (d <= r - 2) return [46, 204, 113, 255]      // #2ecc71
  if (d <= r) return [120, 230, 165, 200]          // 边缘高光
  return [0, 0, 0, 0]                              // 透明
}

// 构造 RGBA 原始像素（每行前加 filter byte 0）
const raw = Buffer.alloc(SIZE * (SIZE * 4 + 1))
for (let y = 0; y < SIZE; y++) {
  raw[y * (SIZE * 4 + 1)] = 0
  for (let x = 0; x < SIZE; x++) {
    const [r, g, b, a] = draw(x, y)
    const o = y * (SIZE * 4 + 1) + 1 + x * 4
    raw[o] = r; raw[o + 1] = g; raw[o + 2] = b; raw[o + 3] = a
  }
}
const ihdr = Buffer.alloc(13)
ihdr.writeUInt32BE(SIZE, 0)
ihdr.writeUInt32BE(SIZE, 4)
ihdr[8] = 8   // bit depth
ihdr[9] = 6   // color type RGBA
ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0
const idat = zlib.deflateSync(raw, { level: 9 })
const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', idat),
  chunk('IEND', Buffer.alloc(0))
])

const assets = path.join(__dirname, '..', 'assets')
fs.mkdirSync(assets, { recursive: true })
const pngPath = path.join(assets, 'icon.png')
fs.writeFileSync(pngPath, png)

// base64（运行时解码写入 userData 供 Tray 使用，规避 asar 路径问题）
fs.writeFileSync(path.join(assets, 'icon.b64'), png.toString('base64'))

// 封装为 .ico（Vista+ 直接内嵌 PNG）
const dir = Buffer.alloc(6)
dir.writeUInt16LE(0, 0)    // reserved
dir.writeUInt16LE(1, 2)    // type=icon
dir.writeUInt16LE(1, 4)    // count=1
const entry = Buffer.alloc(16)
entry[0] = SIZE; entry[1] = SIZE; entry[2] = 0; entry[3] = 0
entry.writeUInt16LE(1, 4)  // planes
entry.writeUInt16LE(32, 6) // bit count
entry.writeUInt32LE(png.length, 8)
entry.writeUInt32LE(22, 12) // offset after dir+entry(6+16)
const ico = Buffer.concat([dir, entry, png])
fs.writeFileSync(path.join(assets, 'icon.ico'), ico)

console.log('icon bytes:', png.length, '| png:', pngPath)
