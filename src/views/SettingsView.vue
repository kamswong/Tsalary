<template>
  <div class="settings">
    <div class="head drag">
      <h2>设置</h2>
      <button class="close no-drag" title="关闭" @click="close">✕</button>
    </div>

    <label>月工资（元）</label>
    <input v-model.number="form.monthly_salary" type="number" min="0" step="100" />

    <label>工作制</label>
    <select v-model="form.schedule">
      <option value="双休">双休（计薪 21.75 天）</option>
      <option value="单休">单休（计薪 26 天）</option>
      <option value="月休">月休 N 天（30 − N）</option>
    </select>

    <label>月休天数（仅「月休」生效）</label>
    <input v-model.number="form.rest_days" type="number" min="0" :disabled="form.schedule !== '月休'" />

    <label>每日工作时间（每行一段 HH:MM-HH:MM）</label>
    <textarea v-model="form.segments_text" rows="3" placeholder="09:00-12:00&#10;13:00-18:00"></textarea>

    <label>五险一金比例 %（预留）</label>
    <input v-model.number="form.insurance_rate" type="number" min="0" step="0.1" />

    <label class="chk">
      <input type="checkbox" v-model="form.insurance_enabled" />
      从日薪中扣除五险一金（预留开关）
    </label>

    <div class="actions">
      <button @click="close">关闭</button>
      <button class="primary" @click="save">应用设置</button>
    </div>

    <p class="err" v-if="err">⚠ {{ err }}</p>
    <p class="ok" v-if="ok">✓ 已保存</p>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { derive, DEFAULT_CONFIG } from '../calc.js'

const form = reactive({ ...DEFAULT_CONFIG })
const err = ref('')
const ok = ref(false)

onMounted(async () => {
  const c = await window.api.getConfig()
  Object.assign(form, c)
})

function close() {
  if (window.api && window.close) window.close()
}

function save() {
  err.value = ''
  ok.value = false
  // 校验
  try {
    derive({ ...form })
  } catch (e) {
    err.value = e.message
    return
  }
  const payload = {
    monthly_salary: Number(form.monthly_salary),
    schedule: form.schedule,
    rest_days: Number(form.rest_days),
    segments_text: form.segments_text,
    insurance_rate: Number(form.insurance_rate),
    insurance_enabled: !!form.insurance_enabled,
    topmost: form.topmost
  }
  window.api.saveConfig(payload).then(() => {
    ok.value = true
    setTimeout(() => (ok.value = false), 1500)
  })
}
</script>

<style scoped>
.settings {
  width: 100vw;
  height: 100vh;
  overflow-y: auto;
  padding: 14px 18px 20px;
  background: var(--card);
  border-radius: 14px;
  border: 1px solid var(--border);
}
.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  -webkit-app-region: drag;
  margin-bottom: 6px;
}
.head h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
}
.close {
  background: transparent;
  padding: 2px 8px;
  font-size: 14px;
  border-radius: 6px;
}
.close:hover { background: #2c3848; }
label {
  display: block;
  font-size: 12px;
  color: var(--muted);
  margin: 12px 0 5px;
}
input[type='number'], select, textarea { width: 100%; }
.chk {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--text);
  margin-top: 12px;
}
.chk input { width: auto; }
.actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 18px;
}
.err { color: var(--danger); font-size: 12px; margin: 10px 0 0; }
.ok { color: var(--accent); font-size: 12px; margin: 10px 0 0; }
</style>
