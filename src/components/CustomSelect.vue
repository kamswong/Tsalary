<template>
  <div class="cs" ref="root">
    <button type="button" class="cs-trigger" @click="toggle">
      <span class="cs-val" :class="{ ph: !current }">{{ current ? current.label : placeholder }}</span>
      <span class="caret" :class="{ open }">▾</span>
    </button>
    <transition name="cs">
      <div v-if="open" class="cs-menu">
        <div
          v-for="opt in options"
          :key="opt.value"
          class="cs-opt"
          :class="{ on: opt.value === modelValue }"
          @click="pick(opt)"
        >{{ opt.label }}</div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  options: { type: Array, default: () => [] }, // [{ label, value }]
  modelValue: { default: undefined },
  placeholder: { type: String, default: '请选择' }
})
const emit = defineEmits(['update:modelValue', 'pick'])

const root = ref(null)
const open = ref(false)

const current = computed(() => props.options.find((o) => o.value === props.modelValue))

function toggle() { open.value = !open.value }

function pick(opt) {
  open.value = false
  emit('update:modelValue', opt.value)
  emit('pick', opt)
}

function onDocClick(e) {
  if (root.value && !root.value.contains(e.target)) open.value = false
}
onMounted(() => document.addEventListener('mousedown', onDocClick))
onUnmounted(() => document.removeEventListener('mousedown', onDocClick))
</script>

<style scoped>
.cs { position: relative; }
.cs-trigger {
  display: flex; align-items: center; justify-content: space-between; gap: 8px;
  width: 100%; border: none; border-radius: 15px; padding: 12px 14px;
  background: var(--input-bg); box-shadow: inset 2px 5px 10px rgba(0, 0, 0, 0.3);
  color: var(--text); font-size: 13px; font-family: inherit; font-weight: 500;
  cursor: pointer; transition: 300ms ease-in-out; text-align: left;
}
.cs-trigger:hover { filter: brightness(1.06); }
.cs-val.ph { color: var(--muted); font-weight: 400; }
.caret { color: var(--muted); transition: transform 200ms ease; }
.caret.open { transform: rotate(180deg); }

.cs-menu {
  position: absolute; top: calc(100% + 6px); left: 0; right: 0; z-index: 30;
  background: var(--card-2); border: 1px solid var(--border); border-radius: 12px;
  padding: 6px; box-shadow: 0 12px 28px rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);
}
.cs-opt {
  padding: 9px 12px; border-radius: 8px; font-size: 13px; color: var(--text);
  cursor: pointer; transition: background 180ms ease;
}
.cs-opt:hover { background: var(--control); }
.cs-opt.on { background: var(--control); color: var(--accent); font-weight: 600; }
.cs-enter-active { transition: opacity .15s ease, transform .15s ease; }
.cs-leave-active { transition: opacity .12s ease; }
.cs-enter-from, .cs-leave-to { opacity: 0; transform: translateY(-4px); }
</style>