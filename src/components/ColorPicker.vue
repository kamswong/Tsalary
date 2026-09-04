<template>
  <div class="cp" :class="{ open }" @click.stop>
    <button ref="btnEl" class="cp-trigger" @click="toggle">
      <span class="cp-swatch cp-swatch--btn" :style="{ background: currentCss }"></span>
      <span class="cp-label">颜色</span>
      <svg class="cp-chev" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
    </button>

    <Teleport to="body">
      <transition name="cp-pop">
        <div v-if="open" class="cp-pop" :style="popStyle" @pointerdown.stop>
        <!-- 饱和度/亮度面板 -->
        <div class="cp-sv" :style="svBgStyle" @pointerdown="onSvDown" @pointermove="onSvMove" @pointerup="svEnd">
          <div class="cp-sv-thumb" :style="svThumbStyle"></div>
        </div>

        <!-- 色相滑杆 -->
        <div class="cp-bar" @pointerdown="onHueDown" @pointermove="onHueMove" @pointerup="barEnd">
          <div class="cp-hue"></div>
          <div class="cp-thumb" :style="hueThumbStyle"></div>
        </div>

        <!-- 透明度滑杆 -->
        <div class="cp-bar" @pointerdown="onAlphaDown" @pointermove="onAlphaMove" @pointerup="barEnd">
          <div class="cp-checker"></div>
          <div class="cp-alpha-overlay" :style="alphaOverlayStyle"></div>
          <div class="cp-thumb" :style="alphaThumbStyle"></div>
        </div>

        <!-- 十六进制输入 -->
        <div class="cp-hex">
          <span class="cp-hex-label">HEX</span>
          <input class="cp-hex-input" v-model="hexDraft" @blur="normalizeHex" @keydown.enter.prevent="$event.target.blur()" maxlength="9" spellcheck="false" />
          <span class="cp-hex-css" :style="{ color: currentCss }">{{ currentCss }}</span>
        </div>

        <!-- 预设色板 -->
        <div class="cp-swatches">
          <button v-for="c in swatches" :key="c" class="cp-swatch cp-swatch--sw" :style="{ background: c }" :data-active="currentCss === c" @click="pickSwatch(c)"></button>
        </div>
      </div>
      </transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  swatches: {
    type: Array,
    default: () => ['#2ecc71', '#3498db', '#e74c3c', '#f39c12', '#9b59b6', '#1abc9c', '#34495e', '#ffffff']
  }
})
const emit = defineEmits(['update:modelValue'])

const open = ref(false)
const st = reactive({ h: 0, s: 0, v: 1, a: 1 })
const btnEl = ref(null)
const pop = reactive({ x: 0, y: 0 })

// ---------- 换算工具 ----------
function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)) }
function hexToRgb(hex) {
  let m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec((hex || '').trim())
  if (m) return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) }
  return null
}
function rgbToHsv(r, g, b) {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min
  let h
  if (d === 0) h = 0
  else if (max === r) h = ((g - b) / d) % 6
  else if (max === g) h = (b - r) / d + 2
  else h = (r - g) / d + 4
  h = Math.round(h * 60); if (h < 0) h += 360
  return { h, s: max === 0 ? 0 : d / max, v: max }
}
function hsvToRgb(h, s, v) {
  h = ((h % 360) + 360) % 360 / 60
  const i = Math.floor(h), f = h - i
  const p = v * (1 - s), q = v * (1 - s * f), t = v * (1 - s * (1 - f))
  const m = [
    [v, t, p], [q, v, p], [p, v, t], [p, q, v], [t, p, v], [v, p, q]
  ][i]
  return { r: Math.round(m[0] * 255), g: Math.round(m[1] * 255), b: Math.round(m[2] * 255) }
}
function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map((x) => clamp(x, 0, 255).toString(16).padStart(2, '0')).join('')
}
function toCss() {
  const { r, g, b } = hsvToRgb(st.h, st.s, st.v)
  if (st.a >= 1) return rgbToHex(r, g, b)
  return `rgba(${r}, ${g}, ${b}, ${+st.a.toFixed(3)})`
}

// 初始化 / 外部值变化时同步
function fromColor(str) {
  const hex = hexToRgb(str)
  if (!hex) return
  const hsv = rgbToHsv(hex.r, hex.g, hex.b)
  st.h = hsv.h; st.s = hsv.s; st.v = hsv.v; st.a = 1
  syncHex()
}
if (props.modelValue) fromColor(props.modelValue)

// ---------- 派生 ----------
const currentCss = computed(() => toCss())
const svBgStyle = computed(() => ({
  background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${st.h}, 100%, 50%))`
}))
const svThumbStyle = computed(() => ({ left: `${st.s * 100}%`, top: `${(1 - st.v) * 100}%` }))
const hueThumbStyle = computed(() => ({ left: `${(st.h / 360) * 100}%` }))
const alphaOverlayStyle = computed(() => {
  const { r, g, b } = hsvToRgb(st.h, st.s, st.v)
  return { background: `linear-gradient(to right, rgba(${r},${g},${b},0), rgb(${r},${g},${b}))` }
})
const alphaThumbStyle = computed(() => ({ left: `${st.a * 100}%` }))
const hexDraft = ref('')
function alphaHex() {
  const x = Math.round(clamp(st.a, 0, 1) * 255).toString(16).padStart(2, '0')
  return x
}
function syncHex() {
  const { r, g, b } = hsvToRgb(st.h, st.s, st.v)
  hexDraft.value = rgbToHex(r, g, b) + (st.a < 1 ? alphaHex() : '')
}

const POP_W = 220
const POP_H = 258
// 弹层固定定位：以触发按钮为锚，优先向下，空间不足则向上，避免被 overflow 容器裁剪
const popStyle = computed(() => ({ left: `${pop.x}px`, top: `${pop.y}px`, width: `${POP_W}px` }))
function position() {
  const r = btnEl.value?.getBoundingClientRect()
  if (!r) return
  const spaceBelow = window.innerHeight - r.bottom
  const up = spaceBelow < POP_H
  pop.x = Math.max(8, Math.min(r.left + r.width - POP_W, window.innerWidth - POP_W - 8))
  pop.y = up ? r.top - POP_H - 8 : r.bottom + 8
}

// ---------- 内部状态写入 + 提交 ----------
function commit() {
  // 规范化写入：整段（无透明度）存 hex，否则存 rgba
  emit('update:modelValue', toCss())
  syncHex()
}

function toggle() {
  open.value = !open.value
  if (open.value) { fromColor(props.modelValue); position() }
}

function pickSwatch(c) {
  fromColor(c)
  commit()
}

// 十六进制输入：输入合法值时同步到颜色状态；输入进行中（未凑够 3/6/8 位）不打断
watch(hexDraft, (val) => {
  const raw = val.replace(/[^#a-fA-F0-9]/g, '').slice(0, 9)
  const m = /^#?([\da-f]{3})$/i.exec(raw) || /^#?([\da-f]{6})$/i.exec(raw) || /^#?([\da-f]{8})$/i.exec(raw)
  if (!m) return
  let hex = m[1]
  if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('')
  const rgb = hexToRgb('#' + hex.slice(0, 6))
  if (!rgb) return
  const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b)
  st.h = hsv.h; st.s = hsv.s; st.v = hsv.v
  st.a = hex.length === 8 ? parseInt(hex.slice(6), 16) / 255 : 1
  commit()
})
function normalizeHex() {
  commit()
}

// ---------- 滑杆拖拽（pointer capture） ----------
let dragging = null // 'sv' | 'hue' | 'alpha' | null
function setVal(el, e, mode) {
  const r = el.getBoundingClientRect()
  const x = clamp((e.clientX - r.left) / r.width, 0, 1)
  const y = clamp((e.clientY - r.top) / r.height, 0, 1)
  if (mode === 'sv') { st.s = x; st.v = 1 - y }
  else if (mode === 'hue') st.h = x * 360
  else st.a = x
  commit()
}
function onSvDown(e) { dragging = 'sv'; e.currentTarget.setPointerCapture?.(e.pointerId); setVal(e.currentTarget, e, 'sv') }
function onSvMove(e) { if (dragging === 'sv') setVal(e.currentTarget, e, 'sv') }
function svEnd() { dragging = null }
function onHueDown(e) { dragging = 'hue'; e.currentTarget.setPointerCapture?.(e.pointerId); setVal(e.currentTarget, e, 'hue') }
function onHueMove(e) { if (dragging === 'hue') setVal(e.currentTarget, e, 'hue') }
function barEnd() { dragging = null }
function onAlphaDown(e) { dragging = 'alpha'; e.currentTarget.setPointerCapture?.(e.pointerId); setVal(e.currentTarget, e, 'alpha') }
function onAlphaMove(e) { if (dragging === 'alpha') setVal(e.currentTarget, e, 'alpha') }

// 点击外部关闭弹层（内部交互通过 @click.stop / @pointerdown.stop 已阻止冒泡）
function onDocClick() { open.value = false }
onMounted(() => document.addEventListener('click', onDocClick))
onBeforeUnmount(() => document.removeEventListener('click', onDocClick))
</script>

<style scoped>
.cp { position: relative; display: inline-flex; }
.cp-trigger {
  display: inline-flex; align-items: center; gap: 8px;
  height: 30px; padding: 0 10px; cursor: pointer;
  border-radius: 10px; border: 1px solid var(--border);
  background: var(--input-bg); color: var(--text);
  font-size: 12px; font-family: inherit; user-select: none;
  transition: border-color .15s ease, background .15s ease;
}
.cp-trigger:hover { border-color: var(--accent); background: var(--input-focus); }
.cp-label { line-height: 1; }
.cp-chev { color: var(--muted); transition: transform .2s ease; }
.cp.open .cp-chev { transform: rotate(180deg); }

.cp-swatch--btn { width: 18px; height: 18px; border-radius: 5px; flex-shrink: 0; border: 1px solid rgba(255,255,255,.18); }

/* 弹层：Teleport 到 body，fixed 定位 */
.cp-pop {
  position: fixed; z-index: 999;
  padding: 12px;
  display: flex; flex-direction: column; gap: 10px;
  background: var(--card-2); border: 1px solid var(--border);
  border-radius: 14px;
  box-shadow: 0 6px 24px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.06);
}

/* SV 面板 */
.cp-sv { position: relative; height: 120px; border-radius: 10px; overflow: hidden; cursor: crosshair; touch-action: none; }
.cp-sv-thumb {
  position: absolute; width: 13px; height: 13px; border-radius: 50%;
  transform: translate(-50%, -50%);
  background: #fff; border: 2px solid rgba(0,0,0,.4);
  box-shadow: 0 0 0 1px #fff;
  pointer-events: none;
}

/* 滑杆 */
.cp-bar { position: relative; height: 14px; border-radius: 7px; cursor: pointer; touch-action: none; overflow: hidden; }
.cp-hue { position: absolute; inset: 0; border-radius: 7px;
  background: linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00); }
.cp-checker { position: absolute; inset: 0; border-radius: 7px;
  background: repeating-conic-gradient(#e0e0e0 0% 25%, #fff 0% 50%) 0 0 / 12px 12px; }
.cp-alpha-overlay { position: absolute; inset: 0; border-radius: 7px; }
.cp-thumb {
  position: absolute; top: 50%; width: 12px; height: 12px; border-radius: 50%;
  transform: translate(-50%, -50%);
  background: #fff; border: 1px solid rgba(0,0,0,.35); box-shadow: 0 0 0 1px #fff;
  pointer-events: none;
}

/* HEX 输入 */
.cp-hex { display: flex; align-items: center; gap: 8px; }
.cp-hex-label { font-size: 11px; color: var(--muted); font-weight: 600; letter-spacing: .5px; }
.cp-hex-input {
  flex: 1; min-width: 0; height: 26px; padding: 0 8px;
  border-radius: 7px; border: 1px solid var(--border);
  background: var(--input-bg); color: var(--text);
  font-size: 12px; font-family: ui-monospace, Menlo, Consolas, monospace;
  outline: none;
  user-select: text;
}
.cp-hex-input:focus { border-color: var(--accent); }
.cp-hex-css { font-size: 11px; font-family: ui-monospace, Menlo, Consolas, monospace; }

/* 预设色板 */
.cp-swatches { display: flex; flex-wrap: wrap; gap: 6px; }
.cp-swatch--sw { width: 20px; height: 20px; border-radius: 6px; cursor: pointer; border: 1px solid rgba(255,255,255,.15); padding: 0; transition: transform .1s ease, box-shadow .1s ease; }
.cp-swatch--sw:hover { transform: scale(1.12); }
.cp-swatch--sw[data-active='true'] { box-shadow: 0 0 0 2px var(--accent); }

.cp-pop-enter-active { transition: opacity .15s ease, transform .15s ease; }
.cp-pop-leave-active { transition: opacity .12s ease; }
.cp-pop-enter-from, .cp-pop-leave-to { opacity: 0; transform: translateY(-4px); }
</style>