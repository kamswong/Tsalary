<template>
  <div class="display">
    <div class="bar drag-bar">
      <span class="title no-drag">实时工资</span>
      <div class="bar-btns no-drag">
        <button class="icon" :title="topmost ? '取消置顶' : '置顶显示'" @click="toggleTop">{{ topmost ? '🔒' : '🔓' }}</button>
        <button class="icon" title="设置" @click="openSettings">⚙</button>
        <button class="icon" title="收进托盘" @click="closeApp">✕</button>
      </div>
    </div>

    <div
      class="amount"
      :class="{ earning: isEarning }"
      title="点击显示/隐藏每秒·日薪"
      @click="toggleMeta"
    >{{ fmtMoney(today) }}</div>

    <div class="meta" v-if="showMeta">
      <div class="row"><span>每秒</span><b>{{ fmtMoney(perSec) }}</b></div>
      <div class="row"><span>日薪</span><b>{{ fmtMoney(insurance_enabled ? dailyWageNet : dailyWage) }}</b></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { derive, fmtMoney, elapsedWorkingSeconds, DEFAULT_CONFIG } from '../calc.js'

const H_HIDE = 88   // 隐藏明细时的高度
const H_SHOW = 116  // 显示明细时的高度

const cfg = ref({ ...DEFAULT_CONFIG })
const today = ref(0)
const perSec = ref(0)
const dailyWage = ref(0)
const dailyWageNet = ref(0)
const insurance_enabled = ref(false)
const topmost = ref(true)
const isEarning = ref(false)
const showMeta = ref(false)

let state = null
let timer = null

function tick() {
  if (!state) return
  const now = new Date()
  const sec = elapsedWorkingSeconds(state.segs, now)
  today.value = state.perSec * sec
  isEarning.value = sec > 0
}

function applyConfig(c) {
  cfg.value = c
  state = derive(c)
  perSec.value = state.perSec
  dailyWage.value = state.dailyWage
  dailyWageNet.value = state.dailyWageNet
  insurance_enabled.value = !!c.insurance_enabled
  topmost.value = c.topmost !== false
  tick()
}

// 置顶切换：立即更新图标，再以主进程返回结果兜底校准
async function toggleTop() {
  const next = !topmost.value
  topmost.value = next
  try { topmost.value = await window.api.toggleTop() } catch (e) {}
}

function toggleMeta() {
  showMeta.value = !showMeta.value
  window.api.resizeDisplay(showMeta.value ? H_SHOW : H_HIDE)
}

function openSettings() { window.api.openSettings() }
function closeApp() { window.api.closeDisplay() }

onMounted(async () => {
  const c = await window.api.getConfig()
  applyConfig(c)
  window.api.onConfig(applyConfig)
  timer = setInterval(tick, 1000)
  // 保证初始高度与"默认隐藏明细"一致
  window.api.resizeDisplay(H_HIDE)
})
onUnmounted(() => { if (timer) clearInterval(timer) })
</script>

<style scoped>
.display {
  width: 220px;
  height: 100%;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.45);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 8px;
  background: var(--card-2);
  cursor: move;
}
.title { font-size: 11px; color: var(--muted); letter-spacing: 1px; }
.bar-btns { display: flex; gap: 2px; }
.icon {
  background: transparent;
  padding: 1px 5px;
  font-size: 12px;
  border-radius: 6px;
}
.icon:hover { background: #2c3848; }
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
.amount.earning { color: var(--accent); }
.amount.earning:hover { color: var(--accent); }
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
