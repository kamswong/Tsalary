<template>
  <div class="display" :class="{ collapsed: level === 0 }" @pointerdown="onAmountDown">
    <!-- 右上角操作按钮：仅展开态显示（收起态只显示金额）；不触发拖拽（no-drag + 阻止冒泡） -->
    <div class="btns no-drag" v-if="level !== 0" @pointerdown.stop>
      <button v-if="level !== 0" class="icon" :title="topmost ? '取消置顶' : '置顶显示'" @click="toggleTop">
        <svg class="ic" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="5" y="11" width="14" height="9" rx="2" :fill="topmost ? 'currentColor' : 'none'" :stroke="topmost ? 'none' : 'currentColor'" />
          <path v-if="topmost" d="M8 11V7a4 4 0 0 1 8 0v4" fill="none" stroke="currentColor" stroke-width="2" />
          <g v-else fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M8 11V7a4 4 0 0 1 8 0" />
            <path d="M16.5 5.5 19 8" />
          </g>
        </svg>
      </button>
      <button class="icon" title="设置" @click="openSettings">
        <svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="3.2" />
          <path d="M19.4 15a1.6 1.6 0 0 0 .32 1.77l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.6 1.6 0 0 0 15 19.4a1.6 1.6 0 0 0-1 1.47V21a2 2 0 1 1-4 0v-.09A1.6 1.6 0 0 0 9 19.4a1.6 1.6 0 0 0-1.77.32l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.6 1.6 0 0 0 4.6 15a1.6 1.6 0 0 0-1.47-1H3a2 2 0 1 1 0-4h.09A1.6 1.6 0 0 0 4.6 9a1.6 1.6 0 0 0-.32-1.77l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.6 1.6 0 0 0 9 4.6a1.6 1.6 0 0 0 1-1.47V3a2 2 0 1 1 4 0v.09a1.6 1.6 0 0 0 1 1.47 1.6 1.6 0 0 0 1.77-.32l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.6 1.6 0 0 0 19.4 9c.6 0 1.05.2 1.47 1H21a2 2 0 1 1 0 4h-.09A1.6 1.6 0 0 0 19.4 15Z" />
        </svg>
      </button>
      <button v-if="level !== 0" class="icon" title="收起为数字" @click="collapse">
        <svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M6 14.5 12 9l6 5.5" />
        </svg>
      </button>
      <button class="icon" title="收进托盘" @click="closeApp">
        <svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true">
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      </button>
    </div>

    <!-- 品牌行：展开态显示，与金额同属一个面板，无独立背景分隔 -->
    <div class="brand" v-if="level !== 0">
      <img class="logo" :src="iconUrl" alt="Tsalary" draggable="false" />
      <span class="title">{{ displayTitle }}</span>
    </div>

    <div
      class="amount"
      :class="{ earning: isEarning && !customColor }"
      :style="amountStyle"
      :title="level === 0 ? '点击展开窗口，拖动可移动' : '点击显示/隐藏每秒·日薪'"
    ><span class="amount-text">{{ fmtMoney(today, currency) }}</span></div>

    <div class="meta" v-if="level === 2">
      <div class="row"><span>每秒</span><b>{{ fmtMoney(perSec, currency, 5) }}</b></div>
      <div class="row"><span>日薪</span><b>{{ fmtMoney(dailyWageNet, currency) }}</b></div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { derive, fmtMoney, elapsedWorkingSeconds, DEFAULT_CONFIG } from '../calc.js'
import iconUrl from '../assets/icon.png'

const H_COLLAPSED = 52  // 收起：仅数字 + 右上按钮（统一玻璃面板）
const H_HIDE = 96       // 展开：品牌 + 金额
const H_SHOW = 128      // 展开：品牌 + 金额 + 明细

const cfg = ref({ ...DEFAULT_CONFIG })
const today = ref(0)
const perSec = ref(0)
const dailyWageNet = ref(0)
const topmost = ref(true)
const isEarning = ref(false)
const customColor = ref('')
const currency = ref('¥')
const level = ref(0) // 0 仅数字 | 1 展开隐藏明细 | 2 展开显示明细

let state = null
let timer = null

const amountStyle = computed(() => (customColor.value ? { color: customColor.value } : {}))

// 悬浮窗标题：取配置值，空值时回退为默认“Tsalary”
const displayTitle = computed(() => {
  const t = (cfg.value.title || '').trim()
  return t || 'Tsalary'
})

function tick() {
  if (!state) return
  const now = new Date()
  const sec = elapsedWorkingSeconds(state.segs, now)
  today.value = state.perSecNet * sec
  isEarning.value = sec > 0
}

function applyConfig(c) {
  cfg.value = c
  state = derive(c)
  perSec.value = state.perSecNet
  dailyWageNet.value = state.dailyWageNet
  topmost.value = c.topmost !== false
  currency.value = typeof c.currency_symbol === 'string' ? c.currency_symbol : '¥'
  customColor.value = (c.number_color || '').trim()
  document.documentElement.dataset.theme = c.theme === 'light' ? 'light' : 'dark'
  tick()
}

// 同步窗口高度
function applyLevel(l) {
  // 白名单取值：只有 0/1/2 有效，越界/NaN 一律兜底为收起高度，避免传给主进程 undefined/NaN
  const HEIGHTS = [H_COLLAPSED, H_HIDE, H_SHOW]
  const h = HEIGHTS[l] ?? H_COLLAPSED
  level.value = l
  window.api.resizeDisplay(h)
}

function collapse() { applyLevel(0) }

// --- 整块面板拖拽/点击 ---
// 用 Pointer Events + setPointerCapture：拖动时光标即使移出窗口、或经过透明像素，
// 移动事件仍持续投递到捕获元素，窗口严格跟随光标。整个 .display 都是拖拽热区，
// 按钮通过 @pointerdown.stop 阻止冒泡，不会误触发拖拽。
let drag = null
function onAmountDown(e) {
  if (e.button !== 0) return // 仅左键 / 触摸，忽略右键中键
  // 收起态：触发（点击展开 / 拖动）只响应金额文字本身，旁边的透明区域不响应
  if (level.value === 0 && !e.target.closest('.amount-text')) return
  drag = { sx: e.screenX, sy: e.screenY, didDrag: false, el: e.currentTarget }
  try { drag.el.setPointerCapture(e.pointerId) } catch (_) {}
  window.api.beginDisplayDrag()
  document.addEventListener('pointermove', onMove)
  document.addEventListener('pointerup', onUp)
}
function onMove(e) {
  if (!drag) return
  const dx = e.screenX - drag.sx
  const dy = e.screenY - drag.sy
  if (!drag.didDrag && Math.abs(dx) + Math.abs(dy) > 3) drag.didDrag = true
  // 主进程读取物理光标坐标定位窗口（1:1 跟随，无 DPI/累计漂移）
  if (drag.didDrag) window.api.moveDisplayDrag()
}
function onUp(e) {
  document.removeEventListener('pointermove', onMove)
  document.removeEventListener('pointerup', onUp)
  try { drag && drag.el && drag.el.releasePointerCapture(e.pointerId) } catch (_) {}
  window.api.endDisplayDrag()
  // 真实拖动离开右下角停靠位；纯点击（展开/收起）不退出停靠
  if (drag && drag.didDrag) window.api.releaseDock()
  if (drag && !drag.didDrag) {
    // 视为点击：展开/收起
    applyLevel(level.value === 0 ? 1 : level.value === 1 ? 2 : 1)
  }
  // 拖动结束总是复位当前层级窗口高度，杜绝拖动期间任何尺寸残留/拉大
  applyLevel(level.value)
  drag = null
}

// 置顶切换：立即更新图标，再以主进程返回结果兜底校准
async function toggleTop() {
  const next = !topmost.value
  topmost.value = next
  try { topmost.value = await window.api.toggleTop() } catch (e) {}
}

function openSettings() { window.api.openSettings() }
function closeApp() { window.api.closeDisplay() }

onMounted(async () => {
  const c = await window.api.getConfig()
  applyConfig(c)
  window.api.onConfig(applyConfig)
  timer = setInterval(tick, 1000)
  applyLevel(0) // 默认仅数字
})
onUnmounted(() => { if (timer) clearInterval(timer) })
</script>

<style scoped>
/* YusButtonB 质感：灰色底 + 绿色微光 + 顶部内高光 + 细亮边 + 大圆角(45px) + hover 提亮
   两种状态（收起/展开）统一灰底；透明窗口下不使用外阴影（会在圆角外四角留下灰印），
   立体感靠内高光 + 渐变 + 边框表达 */
.display {
  position: relative;
  width: 240px;
  height: 100%;
  background:
    linear-gradient(155deg, rgba(46, 204, 113, 0.10), rgba(0, 0, 0, 0) 58%),
    var(--card-2);
  border: 1px solid var(--border);
  border-radius: 25px;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.14),
    inset 0 0 0 1px rgba(255, 255, 255, 0.02);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: background .25s ease, border-color .25s ease;
}
/* 收起态：只展示金额，无背景、无边框、无按钮 */
.display.collapsed {
  background: transparent;
  border-color: transparent;
  box-shadow: none;
}
.display:hover {
  background:
    linear-gradient(155deg, rgba(46, 204, 113, 0.18), rgba(0, 0, 0, 0) 58%),
    var(--card-2);
  border-color: rgba(46, 204, 113, 0.38);
}
.display.collapsed:hover {
  background: transparent;
  border-color: transparent;
}
.display:active {
  border-color: rgba(46, 204, 113, 0.5);
}
.display.collapsed:active {
  border-color: transparent;
}

/* 右上角按钮组：仅展开态显示，悬浮于面板之上，不随面板拖动 */
.btns {
  position: absolute;
  top: 6px;
  right: 18px;
  display: flex;
  gap: 2px;
  z-index: 3;
}
.icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  padding: 0;
  border-radius: 7px;
  background: rgba(255, 255, 255, 0.05);
  color: var(--muted);
  transition: background .15s ease, color .15s ease, transform .05s ease;
}
.icon:hover { background: rgba(46, 204, 113, 0.22); color: var(--accent); }
.icon:active { transform: scale(0.92); }
.ic { width: 15px; height: 15px; }

/* 品牌行：与金额/明细同属一个面板，无独立背景，不作为分隔栏 */
.brand {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 10px 18px 0;
  min-width: 0;
}
.logo {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  flex-shrink: 0;
  user-select: none;
  -webkit-user-drag: none;
}
.title { font-size: 11px; color: var(--muted); letter-spacing: 0.5px; }

.amount {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-size: 28px;
  font-weight: 800;
  color: var(--muted);
  padding: 0 8px;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.5px;
  cursor: pointer;
  transition: color .3s ease;
}
.amount:hover { background: transparent; }
.amount.earning { color: var(--accent); }
.amount.earning .amount-text { color: var(--accent); }
/* 金额文字：收缩贴合文本，成为收起态时唯一的点击/拖动热区 */
.amount-text {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  cursor: pointer;
  transition: background .15s ease;
  user-select: none;
}
.amount-text:hover { background: rgba(255, 255, 255, 0.05); }

.meta {
  display: flex;
  padding: 4px 14px 10px;
  gap: 10px;
}
.row {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11px;
  color: var(--muted);
}
.row b { color: var(--text); font-weight: 600; font-variant-numeric: tabular-nums; }
</style>
