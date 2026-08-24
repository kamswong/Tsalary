<template>
  <div class="settings" ref="root">
    <div class="settings-body">
    <div class="head drag">
      <img class="head-logo" :src="iconUrl" alt="Tsalary" draggable="false" />
      <h2>设置</h2>
      <div class="head-right no-drag">
        <div class="theme-box" title="深色 / 浅色主题">
          <label class="switch">
            <input id="input" type="checkbox" :checked="form.theme === 'dark'" @change="onThemeToggle" />
            <div class="slider round">
              <div class="sun-moon">
                <svg id="moon-dot-1" class="moon-dot" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50"></circle></svg>
                <svg id="moon-dot-2" class="moon-dot" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50"></circle></svg>
                <svg id="moon-dot-3" class="moon-dot" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50"></circle></svg>
                <svg id="light-ray-1" class="light-ray" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50"></circle></svg>
                <svg id="light-ray-2" class="light-ray" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50"></circle></svg>
                <svg id="light-ray-3" class="light-ray" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50"></circle></svg>
                <svg id="cloud-1" class="cloud-dark" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50"></circle></svg>
                <svg id="cloud-2" class="cloud-dark" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50"></circle></svg>
                <svg id="cloud-3" class="cloud-dark" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50"></circle></svg>
                <svg id="cloud-4" class="cloud-light" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50"></circle></svg>
                <svg id="cloud-5" class="cloud-light" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50"></circle></svg>
                <svg id="cloud-6" class="cloud-light" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50"></circle></svg>
              </div>
              <div class="stars">
                <svg id="star-1" class="star" viewBox="0 0 20 20"><path d="M 0 10 C 10 10,10 10 ,0 10 C 10 10 , 10 10 , 10 20 C 10 10 , 10 10 , 20 10 C 10 10 , 10 10 , 10 0 C 10 10,10 10 ,0 10 Z"></path></svg>
                <svg id="star-2" class="star" viewBox="0 0 20 20"><path d="M 0 10 C 10 10,10 10 ,0 10 C 10 10 , 10 10 , 10 20 C 10 10 , 10 10 , 20 10 C 10 10 , 10 10 , 10 0 C 10 10,10 10 ,0 10 Z"></path></svg>
                <svg id="star-3" class="star" viewBox="0 0 20 20"><path d="M 0 10 C 10 10,10 10 ,0 10 C 10 10 , 10 10 , 10 20 C 10 10 , 10 10 , 20 10 C 10 10 , 10 10 , 10 0 C 10 10,10 10 ,0 10 Z"></path></svg>
                <svg id="star-4" class="star" viewBox="0 0 20 20"><path d="M 0 10 C 10 10,10 10 ,0 10 C 10 10 , 10 10 , 10 20 C 10 10 , 10 10 , 20 10 C 10 10 , 10 10 , 10 0 C 10 10,10 10 ,0 10 Z"></path></svg>
              </div>
            </div>
          </label>
        </div>
      </div>
    </div>

    <section class="sec title-sec">
      <h3>窗口标题</h3>
      <label>悬浮窗标题</label>
      <input class="input" v-model="form.title" type="text" maxlength="20" placeholder="Tsalary" />
    </section>

    <div class="grid">
    <section class="sec">
      <h3>工资计算</h3>
      <label>月工资</label>
      <input class="input" v-model.number="form.monthly_salary" type="number" min="0" step="100" />

      <label>工作制</label>
      <CustomSelect :options="scheduleOptions" v-model="form.schedule" placeholder="选择工作制" />

      <template v-if="form.schedule === '月休'">
        <label>月休天数</label>
        <input class="input" v-model.number="form.rest_days" type="number" min="0" />
      </template>

      <label>班次</label>
      <CustomSelect :options="timeOptions" v-model="timeMode" placeholder="选择班次" />
      <textarea v-if="timeMode === '自定义'" class="input time-input" v-model="form.segments_text" rows="3" placeholder="09:00-12:00&#10;13:00-18:00"></textarea>
    </section>

    <section class="sec">
      <h3>扣除与补贴</h3>
      <label>每月扣除</label>
      <input class="input" v-model.number="form.insurance_amount_monthly" type="number" min="0" step="10" placeholder="0" />

      <label>额外补贴</label>
      <div class="allowance" v-for="(a, i) in form.allowances" :key="i">
        <input class="input a-name" v-model="a.name" type="text" placeholder="补贴名称" />
        <input class="input a-amt" v-model.number="a.amount" type="number" min="0" step="10" placeholder="金额" />
        <button class="btn sm ghost del no-drag" title="删除该项" @click="removeAllowance(i)"><span>✕</span></button>
      </div>
      <button class="btn ghost sm add" @click="addAllowance"><span>+ 添加补贴</span></button>
      </section>
    </div>

    <section class="sec">
      <h3>数字显示</h3>
      <div class="dl row2">
        <label class="chk"><input type="checkbox" v-model="form.show_currency_symbol" /> 显示 ¥ 符号</label>
        <label class="chk color">颜色 <input type="color" v-model="form.number_color" /></label>
      </div>
    </section>

    <div class="actions">
      <ul class="example-2 no-drag">
        <li class="icon-content" v-for="s in SOCIALS" :key="s.social">
          <a :aria-label="s.name" :data-social="s.social" @click="openSocial(s.url)">
            <div class="filled"></div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="currentColor"
              :viewBox="s.viewBox || '0 0 16 16'"
              xml:space="preserve"
            >
              <path :d="s.path" fill="currentColor"></path>
            </svg>
          </a>
          <div class="tooltip">{{ s.name }}</div>
        </li>
      </ul>
      <div class="actions-right">
        <button class="btn primary" @click="save" :disabled="saving"><span>应用设置</span></button>
        <button class="btn ghost" @click="close"><span>关闭</span></button>
      </div>
    </div>
    </div>

    <footer class="copyright no-drag">Copyright © 2026 C.%Studio All Rights Reserved.</footer>

    <transition name="fade">
      <div v-if="saving" class="saving">
        <svg class="pl" viewBox="0 0 240 240">
          <circle class="pl__ring pl__ring--a" cx="120" cy="120" r="105" fill="none" stroke="#000" stroke-width="20" stroke-dasharray="0 660" stroke-dashoffset="-330" stroke-linecap="round"></circle>
          <circle class="pl__ring pl__ring--b" cx="120" cy="120" r="35" fill="none" stroke="#000" stroke-width="20" stroke-dasharray="0 220" stroke-dashoffset="-110" stroke-linecap="round"></circle>
          <circle class="pl__ring pl__ring--c" cx="85" cy="120" r="70" fill="none" stroke="#000" stroke-width="20" stroke-dasharray="0 440" stroke-linecap="round"></circle>
          <circle class="pl__ring pl__ring--d" cx="155" cy="120" r="70" fill="none" stroke="#000" stroke-width="20" stroke-dasharray="0 440" stroke-linecap="round"></circle>
        </svg>
      </div>
    </transition>

    <transition name="toast">
      <div v-if="toast" class="toast" :class="toast.type">
        <span>{{ toast.type === 'success' ? '✓' : '⚠' }}</span>
        {{ toast.msg }}
      </div>
    </transition>
  </div>
</template>

<script setup>
import { reactive, ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { derive, DEFAULT_CONFIG } from '../calc.js'
import CustomSelect from '../components/CustomSelect.vue'
import iconUrl from '../assets/icon.png'

const GITHUB_URL = 'https://github.com/kamswong/Tsalary'

const scheduleOptions = [
  { label: '双休（计薪 21.75 天）', value: '双休' },
  { label: '单休（计薪 26 天）', value: '单休' },
  { label: '月休 N 天（30 − N）', value: '月休' }
]
const timeOptions = [
  { label: '自定义', value: '自定义' },
  { label: '朝九晚六（9-12 / 14-18）', value: '朝九晚六' },
  { label: '朝九晚五（9-12 / 13-17）', value: '朝九晚五' },
  { label: '早八晚六（8-12 / 14-18）', value: '早八晚六' }
]

const form = reactive({ ...DEFAULT_CONFIG })
const toast = ref(null)
const saving = ref(false)
const root = ref(null)
let toastTimer = null
let resizeObserver = null

const TIME_TEMPLATES = {
  '朝九晚六': '09:00-12:00\n14:00-18:00',
  '朝九晚五': '09:00-12:00\n13:00-17:00',
  '早八晚六': '08:00-12:00\n14:00-18:00'
}
const timeMode = ref('自定义')
// 选择非“自定义”班次时，自动填入工作时间
watch(timeMode, (v) => {
  if (v !== '自定义' && TIME_TEMPLATES[v]) form.segments_text = TIME_TEMPLATES[v]
})

function showToast(type, msg) {
  toast.value = { type, msg }
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toast.value = null), 2000)
}

onMounted(async () => {
  const c = await window.api.getConfig()
  Object.assign(form, c)
  document.documentElement.dataset.theme = c.theme === 'light' ? 'light' : 'dark'
  const last = (form.segments_text || '').trim()
  const found = Object.keys(TIME_TEMPLATES).find((k) => TIME_TEMPLATES[k] === last)
  timeMode.value = found || '自定义'
  await nextTick()
  fitHeight()
  // 内容高度变化时自适应调整窗口
  if (typeof ResizeObserver !== 'undefined' && root.value) {
    resizeObserver = new ResizeObserver(() => fitHeight())
    resizeObserver.observe(root.value)
  }
})

function fitHeight() {
  if (root.value) window.api.resizeSettings(Math.ceil(root.value.offsetHeight))
}

onUnmounted(() => { if (resizeObserver) resizeObserver.disconnect() })

const SOCIALS = [
  {
    name: 'GitHub',
    social: 'github',
    url: GITHUB_URL,
    path: 'M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8'
  },
  {
    name: 'Instagram',
    social: 'instagram',
    url: 'https://www.instagram.com/kams_cx?igsi=bGJpcGJkNHV6ZDQ5',
    path: 'M8 0C5.829 0 5.556.01 4.703.048 3.85.088 3.269.222 2.76.42a3.9 3.9 0 0 0-1.417.923A3.9 3.9 0 0 0 .42 2.76C.222 3.268.087 3.85.048 4.7.01 5.555 0 5.827 0 8.001c0 2.172.01 2.444.048 3.297.04.852.174 1.433.372 1.942.205.526.478.972.923 1.417.444.445.89.719 1.416.923.51.198 1.09.333 1.942.372C5.555 15.99 5.827 16 8 16s2.444-.01 3.298-.048c.851-.04 1.434-.174 1.943-.372a3.9 3.9 0 0 0 1.416-.923c.445-.445.718-.891.923-1.417.197-.509.332-1.09.372-1.942C15.99 10.445 16 10.173 16 8s-.01-2.445-.048-3.299c-.04-.851-.175-1.433-.372-1.941a3.9 3.9 0 0 0-.923-1.417A3.9 3.9 0 0 0 13.24.42c-.51-.198-1.092-.333-1.943-.372C10.443.01 10.172 0 7.998 0zm-.717 1.442h.718c2.136 0 2.389.007 3.232.046.78.035 1.204.166 1.486.275.373.145.64.319.92.599s.453.546.598.92c.11.281.24.705.275 1.485.039.843.047 1.096.047 3.231s-.008 2.389-.047 3.232c-.035.78-.166 1.203-.275 1.485a2.5 2.5 0 0 1-.599.919c-.28.28-.546.453-.92.598-.28.11-.704.24-1.485.276-.843.038-1.096.047-3.232.047s-2.39-.009-3.233-.047c-.78-.036-1.203-.166-1.485-.276a2.5 2.5 0 0 1-.92-.598 2.5 2.5 0 0 1-.6-.92c-.109-.281-.24-.705-.275-1.485-.038-.843-.046-1.096-.046-3.233s.008-2.388.046-3.231c.036-.78.166-1.204.276-1.486.145-.373.319-.64.599-.92s.546-.453.92-.598c.282-.11.705-.24 1.485-.276.738-.034 1.024-.044 2.515-.045zm4.988 1.328a.96.96 0 1 0 0 1.92.96.96 0 0 0 0-1.92m-4.27 1.122a4.109 4.109 0 1 0 0 8.217 4.109 4.109 0 0 0 0-8.217m0 1.441a2.667 2.667 0 1 1 0 5.334 2.667 2.667 0 0 1 0-5.334'
  },
  {
    name: '抖音',
    social: 'tiktok',
    viewBox: '0 0 24 24',
    url: 'https://v.douyin.com/Lc2RFKv9vIs/',
    path: 'M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z'
  }
]

function openSocial(url) {
  if (window.api && url) window.api.openExternal(url)
}

function onThemeToggle(e) {
  form.theme = e.target.checked ? 'dark' : 'light'
  document.documentElement.dataset.theme = form.theme
  window.api.saveConfig({ theme: form.theme })
}

function addAllowance() {
  form.allowances.push({ name: '', amount: 0 })
}
function removeAllowance(i) {
  form.allowances.splice(i, 1)
}

function close() {
  if (window.api && window.close) window.close()
}

function save() {
  // 校验
  try {
    derive({ ...form })
  } catch (e) {
    showToast('error', e.message)
    return
  }
  if (saving.value) return
  saving.value = true
  const payload = {
    monthly_salary: Number(form.monthly_salary),
    schedule: form.schedule,
    rest_days: Number(form.rest_days),
    segments_text: form.segments_text,
    insurance_amount_monthly: Number(form.insurance_amount_monthly) || 0,
    allowances: (form.allowances || [])
      .filter((a) => a.name.trim() !== '' || Number(a.amount) > 0)
      .map((a) => ({ name: a.name.trim(), amount: Number(a.amount) || 0 })),
    show_currency_symbol: form.show_currency_symbol !== false,
    number_color: form.number_color || '',
    theme: form.theme,
    topmost: form.topmost,
    title: (form.title || '').trim()
  }
  window.api.saveConfig(payload).then(() => {
    setTimeout(() => { saving.value = false }, 400)
    showToast('success', '已保存')
  })
}
</script>

<style scoped>
.settings {
  position: relative;
  width: 100vw;
  height: auto;
  max-height: 820px;
  display: flex;
  flex-direction: column;
  padding: 0;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0) 26%),
    var(--glass-bg);
  backdrop-filter: blur(34px) saturate(1.6);
  -webkit-backdrop-filter: blur(34px) saturate(1.6);
  border-radius: 16px;
  border: 1px solid var(--glass-border);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06), 0 8px 32px rgba(0, 0, 0, 0.4);
}
.settings-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: 16px 22px 4px;
}
.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 28px;
  align-items: start;
}
.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  -webkit-app-region: drag;
  margin-bottom: 12px;
}
.head h2 { margin: 0; font-size: 16px; font-weight: 700; }
.head .head-logo {
  width: 26px;
  height: 26px;
  border-radius: 6px;
  margin-right: 8px;
  flex-shrink: 0;
  user-select: none;
  -webkit-user-drag: none;
}
.head-right { display: flex; align-items: center; justify-content: flex-end; gap: 10px; }
.theme-box { display: flex; align-items: center; align-self: center; gap: 8px; }

/* ========== 社交图标（GitHub / Instagram / TikTok） ========== */
.example-2 {
  list-style: none;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0;
  padding: 0;
}
.example-2 .icon-content {
  margin: 0 8px;
  position: relative;
}
.example-2 .icon-content .tooltip {
  position: absolute;
  top: -30px;
  left: 50%;
  transform: translateX(-50%);
  color: #fff;
  padding: 6px 10px;
  border-radius: 5px;
  opacity: 0;
  visibility: hidden;
  font-size: 14px;
  white-space: nowrap;
  transition: all 0.3s ease;
}
.example-2 .icon-content:hover .tooltip {
  opacity: 1;
  visibility: visible;
  top: -50px;
}
.example-2 .icon-content a {
  position: relative;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  color: #4d4d4d;
  background-color: #fff;
  transition: all 0.3s ease-in-out;
  cursor: pointer;
}
.example-2 .icon-content a:hover {
  box-shadow: 3px 2px 45px 0px rgb(0 0 0 / 12%);
}
.example-2 .icon-content a svg {
  position: relative;
  z-index: 1;
  width: 24px;
  height: 24px;
}
.example-2 .icon-content a:hover {
  color: white;
}
.example-2 .icon-content a .filled {
  position: absolute;
  top: auto;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 0;
  background-color: #000;
  transition: all 0.3s ease-in-out;
}
.example-2 .icon-content a:hover .filled {
  height: 100%;
}
.example-2 .icon-content a[data-social="github"] .filled,
.example-2 .icon-content a[data-social="github"] ~ .tooltip {
  background-color: #24262a;
}
.example-2 .icon-content a[data-social="instagram"] .filled,
.example-2 .icon-content a[data-social="instagram"] ~ .tooltip {
  background: linear-gradient(
    45deg,
    #405de6,
    #5b51db,
    #b33ab4,
    #c135b4,
    #e1306c,
    #fd1f1f
  );
}
.example-2 .icon-content a[data-social="tiktok"] .filled,
.example-2 .icon-content a[data-social="tiktok"] ~ .tooltip {
  background-color: #010101;
}

/* ========== 主题日月开关 ========== */
.switch { position: relative; display: inline-block; width: 60px; height: 34px; }
.switch #input { opacity: 0; width: 0; height: 0; }
.slider {
  position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0;
  background-color: #2196f3; -webkit-transition: 0.4s; transition: 0.4s;
  z-index: 0; overflow: hidden;
}
.sun-moon {
  position: absolute; content: ""; height: 26px; width: 26px; left: 4px; bottom: 4px;
  background-color: yellow; -webkit-transition: 0.4s; transition: 0.4s;
}
#input:checked + .slider { background-color: black; }
#input:focus + .slider { box-shadow: 0 0 1px #2196f3; }
#input:checked + .slider .sun-moon {
  -webkit-transform: translateX(26px); -ms-transform: translateX(26px); transform: translateX(26px);
  background-color: white;
}
.moon-dot { opacity: 0; transition: 0.4s; fill: gray; }
#input:checked + .slider .sun-moon .moon-dot { opacity: 1; }
.slider.round { border-radius: 34px; }
.slider.round .sun-moon { border-radius: 50%; }
#moon-dot-1 { left: 10px; top: 3px; position: absolute; width: 6px; height: 6px; z-index: 4; }
#moon-dot-2 { left: 2px; top: 10px; position: absolute; width: 10px; height: 10px; z-index: 4; }
#moon-dot-3 { left: 16px; top: 18px; position: absolute; width: 3px; height: 3px; z-index: 4; }
#light-ray-1 { left: -8px; top: -8px; position: absolute; width: 43px; height: 43px; z-index: -1; fill: white; opacity: 10%; }
#light-ray-2 { left: -50%; top: -50%; position: absolute; width: 55px; height: 55px; z-index: -1; fill: white; opacity: 10%; }
#light-ray-3 { left: -18px; top: -18px; position: absolute; width: 60px; height: 60px; z-index: -1; fill: white; opacity: 10%; }
.cloud-light { position: absolute; fill: #eee; animation-name: cloud-move; animation-duration: 6s; animation-iteration-count: infinite; }
.cloud-dark { position: absolute; fill: #ccc; animation-name: cloud-move; animation-duration: 6s; animation-iteration-count: infinite; animation-delay: 1s; }
#cloud-1 { left: 30px; top: 15px; width: 40px; }
#cloud-2 { left: 44px; top: 10px; width: 20px; }
#cloud-3 { left: 18px; top: 24px; width: 30px; }
#cloud-4 { left: 36px; top: 18px; width: 40px; }
#cloud-5 { left: 48px; top: 14px; width: 20px; }
#cloud-6 { left: 22px; top: 26px; width: 30px; }
@keyframes cloud-move {
  0% { transform: translateX(0px); }
  40% { transform: translateX(4px); }
  80% { transform: translateX(-4px); }
  100% { transform: translateX(0px); }
}
.stars { transform: translateY(-32px); opacity: 0; transition: 0.4s; }
.star { fill: white; position: absolute; -webkit-transition: 0.4s; transition: 0.4s; animation-name: star-twinkle; animation-duration: 2s; animation-iteration-count: infinite; }
#input:checked + .slider .stars { -webkit-transform: translateY(0); -ms-transform: translateY(0); transform: translateY(0); opacity: 1; }
#star-1 { width: 20px; top: 2px; left: 3px; animation-delay: 0.3s; }
#star-2 { width: 6px; top: 16px; left: 3px; }
#star-3 { width: 12px; top: 20px; left: 10px; animation-delay: 0.6s; }
#star-4 { width: 18px; top: 0px; left: 18px; animation-delay: 1.3s; }
@keyframes star-twinkle {
  0% { transform: scale(1); }
  40% { transform: scale(1.2); }
  80% { transform: scale(0.8); }
  100% { transform: scale(1); }
}

/* ========== 分组布局 ========== */
.sec { margin-top: 16px; padding-top: 2px; min-width: 0; }
.sec h3 {
  margin: 0 0 4px; font-size: 12px; font-weight: 600; color: var(--accent-2);
  letter-spacing: 1px; border-bottom: 1px solid var(--border); padding-bottom: 5px;
}
label { display: block; font-size: 12px; color: var(--muted); margin: 16px 0 7px; }

/* ========== 输入框（neumorphic） ========== */
.input {
  width: 100%; border: none; outline: none; border-radius: 15px; padding: 12px 14px;
  background: var(--input-bg); box-shadow: inset 2px 5px 10px rgba(0, 0, 0, 0.3);
  transition: 300ms ease-in-out; color: var(--text);
  font-size: 13px; font-family: inherit;
}
.input:focus { background: var(--input-focus); transform: scale(1.03); box-shadow: 13px 13px 100px grey, -13px -13px 100px #fff; }
select.input { appearance: auto; -webkit-appearance: auto; cursor: pointer; }
textarea.input { resize: none; line-height: 1.5; }
.time-input { margin-top: 14px; }
.allowance { display: flex; gap: 8px; align-items: center; margin-top: 10px; }
.allowance .a-name { flex: 1; }
.allowance .a-amt { width: 110px; }

/* ========== 按钮（玻璃光泽 + 高光扫动 + 旋转描边） ========== */
.btn {
  --bw: clamp(1px, 0.0625em, 4px);
  position: relative; cursor: pointer; border: none; border-radius: 999vw; padding: 0;
  -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
  background: linear-gradient(-75deg, rgba(255,255,255,.05), rgba(255,255,255,.2), rgba(255,255,255,.05));
  box-shadow:
    inset 0 0.125em 0.125em rgba(0, 0, 0, 0.05),
    inset 0 -0.125em 0.125em rgba(255, 255, 255, 0.5),
    0 0.25em 0.125em -0.125em rgba(0, 0, 0, 0.2),
    0 0 0.1em 0.25em inset rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(3px); -webkit-backdrop-filter: blur(3px);
  transition: all 400ms cubic-bezier(0.25, 1, 0.5, 1);
}
.btn span {
  position: relative; display: block; padding: 11px 26px; font-size: 13px; font-weight: 600;
  font-family: inherit; letter-spacing: -0.02em; color: var(--text);
  text-shadow: 0 0.25em 0.05em rgba(0, 0, 0, 0.1);
  transition: all 400ms cubic-bezier(0.25, 1, 0.5, 1);
}
.btn:hover { transform: scale(0.975); }
.btn:active { transform: scale(0.93); }

/* 文本高光扫动 */
.btn span::after {
  content: ""; position: absolute; z-index: 1; inset: var(--bw);
  border-radius: 999vw; overflow: clip; pointer-events: none;
  background: linear-gradient(-45deg, transparent 0%, rgba(255,255,255,.55) 40% 50%, transparent 55%);
  background-size: 200% 200%; background-position: 0% 50%; background-repeat: no-repeat;
  mix-blend-mode: screen;
  transition: background-position 500ms cubic-bezier(0.25, 1, 0.5, 1);
}
.btn:hover span::after { background-position: 30% 50%; }
.btn:active span::after { background-position: 55% 15%; }

/* 旋转描边 */
.btn::after {
  content: ""; position: absolute; z-index: 1; inset: 0;
  border-radius: 999vw; padding: var(--bw); box-sizing: border-box;
  background:
    conic-gradient(from -75deg at 50% 50%,
      rgba(0, 0, 0, 0.55), rgba(0, 0, 0, 0) 5% 40%, rgba(0, 0, 0, 0.55) 50%, rgba(0, 0, 0, 0) 60% 95%, rgba(0, 0, 0, 0.55)),
    linear-gradient(180deg, rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0.5));
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  mask-composite: exclude;
  transition: all 400ms cubic-bezier(0.25, 1, 0.5, 1);
}
.btn:hover::after {
  background:
    conic-gradient(from -125deg at 50% 50%,
      rgba(0, 0, 0, 0.55), rgba(0, 0, 0, 0) 5% 40%, rgba(0, 0, 0, 0.55) 50%, rgba(0, 0, 0, 0) 60% 95%, rgba(0, 0, 0, 0.55)),
    linear-gradient(180deg, rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0.5));
}

.btn.primary {
  background: linear-gradient(-75deg, #15903f, #2ecc71, #15903f);
}
.btn.primary span { color: #06281a; font-weight: 700; }
.btn.primary::after {
  background:
    conic-gradient(from -75deg at 50% 50%,
      rgba(6, 40, 26, 0.6), rgba(6, 40, 26, 0) 5% 40%, rgba(6, 40, 26, 0.6) 50%, rgba(6, 40, 26, 0) 60% 95%, rgba(6, 40, 26, 0.6)),
    linear-gradient(180deg, rgba(255, 255, 255, 0.65), rgba(255, 255, 255, 0.65));
}
.btn.primary:hover::after {
  background:
    conic-gradient(from -125deg at 50% 50%,
      rgba(6, 40, 26, 0.6), rgba(6, 40, 26, 0) 5% 40%, rgba(6, 40, 26, 0.6) 50%, rgba(6, 40, 26, 0) 60% 95%, rgba(6, 40, 26, 0.6)),
    linear-gradient(180deg, rgba(255, 255, 255, 0.65), rgba(255, 255, 255, 0.65));
}

.btn.ghost { background: transparent; }
.btn.ghost span { color: var(--muted); }
.btn.sm span { padding: 8px 15px; font-size: 12px; }
.btn.del:hover span { color: var(--danger); }
.add { margin: 8px 0 0 auto; display: block; }
.dl.row2 { display: flex; align-items: center; gap: 16px; }
.chk { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text); margin: 0; }
.chk input[type='checkbox'] { width: auto; }
.chk input[type='color'] { width: 44px; height: 28px; padding: 2px; border-radius: 6px; }
.actions { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: 18px; }
.actions-right { display: flex; gap: 10px; }
.copyright {
  flex: 0 0 auto;
  text-align: center;
  font-size: 11px;
  color: var(--muted);
  letter-spacing: 0.5px;
  opacity: 0.8;
  user-select: none;
  padding: 12px 16px 18px;
  border-top: 1px solid var(--glass-border);
}
.btn:disabled { opacity: .6; pointer-events: none; }

/* ========== 保存加载动画（四环） ========== */
.saving {
  position: fixed; inset: 0; z-index: 60;
  display: flex; align-items: center; justify-content: center;
  background: rgba(0, 0, 0, 0.28);
  border-radius: 16px;
}
.pl { width: 3.4em; height: 3.4em; }
.pl__ring { animation: ringA 2s linear infinite; }
.pl__ring--a { stroke: #f42f25; }
.pl__ring--b { animation-name: ringB; stroke: #f49725; }
.pl__ring--c { animation-name: ringC; stroke: #255ff4; }
.pl__ring--d { animation-name: ringD; stroke: #f42582; }
@keyframes ringA {
  from, 4% { stroke-dasharray: 0 660; stroke-width: 20; stroke-dashoffset: -330; }
  12% { stroke-dasharray: 60 600; stroke-width: 30; stroke-dashoffset: -335; }
  32% { stroke-dasharray: 60 600; stroke-width: 30; stroke-dashoffset: -595; }
  40%, 54% { stroke-dasharray: 0 660; stroke-width: 20; stroke-dashoffset: -660; }
  62% { stroke-dasharray: 60 600; stroke-width: 30; stroke-dashoffset: -665; }
  82% { stroke-dasharray: 60 600; stroke-width: 30; stroke-dashoffset: -925; }
  90%, to { stroke-dasharray: 0 660; stroke-width: 20; stroke-dashoffset: -990; }
}
@keyframes ringB {
  from, 12% { stroke-dasharray: 0 220; stroke-width: 20; stroke-dashoffset: -110; }
  20% { stroke-dasharray: 20 200; stroke-width: 30; stroke-dashoffset: -115; }
  40% { stroke-dasharray: 20 200; stroke-width: 30; stroke-dashoffset: -195; }
  48%, 62% { stroke-dasharray: 0 220; stroke-width: 20; stroke-dashoffset: -220; }
  70% { stroke-dasharray: 20 200; stroke-width: 30; stroke-dashoffset: -225; }
  90% { stroke-dasharray: 20 200; stroke-width: 30; stroke-dashoffset: -305; }
  98%, to { stroke-dasharray: 0 220; stroke-width: 20; stroke-dashoffset: -330; }
}
@keyframes ringC {
  from { stroke-dasharray: 0 440; stroke-width: 20; stroke-dashoffset: 0; }
  8% { stroke-dasharray: 40 400; stroke-width: 30; stroke-dashoffset: -5; }
  28% { stroke-dasharray: 40 400; stroke-width: 30; stroke-dashoffset: -175; }
  36%, 58% { stroke-dasharray: 0 440; stroke-width: 20; stroke-dashoffset: -220; }
  66% { stroke-dasharray: 40 400; stroke-width: 30; stroke-dashoffset: -225; }
  86% { stroke-dasharray: 40 400; stroke-width: 30; stroke-dashoffset: -395; }
  94%, to { stroke-dasharray: 0 440; stroke-width: 20; stroke-dashoffset: -440; }
}
@keyframes ringD {
  from, 8% { stroke-dasharray: 0 440; stroke-width: 20; stroke-dashoffset: 0; }
  16% { stroke-dasharray: 40 400; stroke-width: 30; stroke-dashoffset: -5; }
  36% { stroke-dasharray: 40 400; stroke-width: 30; stroke-dashoffset: -175; }
  44%, 50% { stroke-dasharray: 0 440; stroke-width: 20; stroke-dashoffset: -220; }
  58% { stroke-dasharray: 40 400; stroke-width: 30; stroke-dashoffset: -225; }
  78% { stroke-dasharray: 40 400; stroke-width: 30; stroke-dashoffset: -395; }
  86%, to { stroke-dasharray: 0 440; stroke-width: 20; stroke-dashoffset: -440; }
}
.fade-enter-active, .fade-leave-active { transition: opacity .2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* ========== 弹窗提示 ========== */
.toast {
  position: fixed; left: 50%; bottom: 18px; transform: translateX(-50%);
  display: flex; align-items: center; gap: 8px; z-index: 50;
  padding: 10px 18px; border-radius: 999vw; font-size: 13px; font-weight: 500;
  background: var(--control); color: var(--text);
  box-shadow: inset 0 .125em .125em rgba(0,0,0,.08), 0 .4em .8em rgba(0,0,0,.25);
}
.toast.error { color: var(--danger); }
.toast.success { color: var(--accent); }
.toast-enter-active, .toast-leave-active { transition: all .25s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateX(-50%) translateY(10px); }
</style>