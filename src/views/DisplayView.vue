<template>
  <div class="display" :class="{ collapsed: level === 0 }">
    <div v-if="level !== 0" class="bar drag-bar">
      <img class="bar-logo no-drag" :src="iconUrl" alt="Tsalary" draggable="false" />
      <span class="title no-drag">{{ displayTitle }}</span>
      <div class="bar-btns no-drag">
        <button class="icon" :title="topmost ? '取消置顶' : '置顶显示'" @click="toggleTop">
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
        <button class="icon" title="收起为数字" @click="collapse">
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
    </div>

    <div
      class="amount"
      :class="{ earning: isEarning && !customColor }"
      :style="amountStyle"
      :title="level === 0 ? '点击展开窗口，拖动可移动' : '点击显示/隐藏每秒·日薪'"
      @pointerdown="onAmountDown"
    >{{ fmtMoney(today, showSymbol) }}</div>

    <div class="meta" v-if="level === 2">
      <div class="row"><span>每秒</span><b>{{ fmtMoney(perSec, showSymbol) }}</b></div>
      <div class="row"><span>日薪</span><b>{{ fmtMoney(dailyWageNet, showSymbol) }}</b></div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { derive, fmtMoney, elapsedWorkingSeconds, DEFAULT_CONFIG } from '../calc.js'
import iconUrl from '../assets/icon.png'

const H_COLLAPSED = 48  // 仅数字（透明无背景）
const H_HIDE = 88       // 展开，隐藏明细
const H_SHOW = 116      // 展开，显示明细

const cfg = ref({ ...DEFAULT_CONFIG })
const today = ref(0)
const perSec = ref(0)
const dailyWageNet = ref(0)
const topmost = ref(true)
const isEarning = ref(false)
const customColor = ref('')
const showSymbol = ref(true)
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
  showSymbol.value = c.show_currency_symbol !== false
  customColor.value = (c.number_color || '').trim()
  document.documentElement.dataset.theme = c.theme === 'light' ? 'light' : 'dark'
  tick()
}

// 同步窗口高度
function applyLevel(l) {
  level.value = l
  window.api.resizeDisplay([H_COLLAPSED, H_HIDE, H_SHOW][l])
}

function collapse() { applyLevel(0) }

// --- 纯数字态拖拽/点击 ---
// 用 Pointer Events + setPointerCapture：拖动时光标即使移出 240×48 的小窗口、
// 或经过透明像素（点穿透），移动事件仍持续投递到捕获元素，窗口严格跟随光标，
// 解决“隐藏背景后拖拽金额往下滑”的拖尾漂移问题。背景保持完全透明。
let drag = null
function onAmountDown(e) {
  if (e.button !== 0) return // 仅左键 / 触摸，忽略右键中键
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
.display {
  width: 240px;
  height: 100%;
  background: var(--glass-bg);
  backdrop-filter: blur(28px) saturate(1.5);
  -webkit-backdrop-filter: blur(28px) saturate(1.5);
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.45);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.amount {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-size: 28px;
  font-weight: 800;
  color: var(--muted);
  padding: 0 6px;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.5px;
  cursor: pointer;
  transition: color .3s ease;
}
.amount:hover { color: var(--text); }
.amount:not(.earning):hover { color: var(--text); }
.amount.earning { color: var(--accent); }
.amount.earning:hover { color: var(--accent); }
/* 收起态：完全透明，只剩数字，可拖动 */
.display.collapsed {
  background: transparent;
  border: none;
  box-shadow: none;
  border-radius: 0;
}
.bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 8px;
  background: var(--card-2);
  cursor: move;
}
.bar .bar-logo {
  width: 15px;
  height: 15px;
  border-radius: 3px;
  margin-right: 6px;
  flex-shrink: 0;
  user-select: none;
  -webkit-user-drag: none;
}
.title { font-size: 11px; color: var(--muted); letter-spacing: 1px; }
.bar-btns { display: flex; gap: 2px; }
.icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  padding: 3px 5px;
  border-radius: 6px;
  width: 22px;
  height: 22px;
}
.ic { width: 15px; height: 15px; }
.icon:hover { background: #2c3848; }
.meta {
  display: flex;
  padding: 4px 12px 8px;
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