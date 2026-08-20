// 纯计算逻辑（渲染端两窗口共用）

export const DEFAULT_CONFIG = {
  monthly_salary: 8000,
  schedule: '双休', // 双休 | 单休 | 月休
  rest_days: 4, // 月休天数
  segments_text: '09:00-12:00\n13:00-18:00',
  insurance_rate: 10.5, // 五险一金个人合计比例（预留）
  insurance_enabled: false, // 默认不扣除，仅预留
  topmost: true
}

export function parseSegments(text) {
  const segs = []
  for (let line of text.trim().split(/\r?\n/)) {
    line = line.trim()
    if (!line) continue
    const m = line.match(/^(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})$/)
    if (!m) throw new Error('时段格式应为 HH:MM-HH:MM，例如 09:00-12:00')
    let [, sh, sm, eh, em] = m.map(Number)
    if (sh > 23 || eh > 23 || sm > 59 || em > 59) throw new Error('时间超出范围')
    const start = sh * 60 + sm
    const end = eh * 60 + em
    if (end <= start) throw new Error('结束时间需晚于开始时间: ' + line)
    segs.push([start, end])
  }
  if (!segs.length) throw new Error('请至少填写一个工作时段')
  segs.sort((a, b) => a[0] - b[0])
  return segs
}

export function workingDaysPerMonth(schedule, restDays) {
  if (schedule === '双休') return 21.75 // 法定月计薪天数 (365-104)/12
  if (schedule === '单休') return 26.0 // 约 6/7*30
  return Math.max(1.0, 30.0 - Number(restDays))
}

export function dailyWorkingSeconds(segs) {
  return segs.reduce((sum, [s, e]) => sum + (e - s), 0) * 60
}

export function elapsedWorkingSeconds(segs, now) {
  const cur = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60
  let total = 0
  for (const [s, e] of segs) {
    if (cur <= s) continue
    const segEnd = Math.min(cur, e)
    if (segEnd > s) total += segEnd - s
  }
  return total * 60
}

// 由配置派生所有金额
export function derive(cfg) {
  const segs = parseSegments(cfg.segments_text || '')
  const wd = workingDaysPerMonth(cfg.schedule, cfg.rest_days)
  const dailySeconds = dailyWorkingSeconds(segs)
  const dailyWage = wd > 0 ? Number(cfg.monthly_salary) / wd : 0
  const insRate = Number(cfg.insurance_rate) || 0
  const dailyWageNet = cfg.insurance_enabled ? dailyWage * (1 - insRate / 100) : dailyWage
  const perSec = dailySeconds > 0 ? dailyWage / dailySeconds : 0
  const perSecNet = dailySeconds > 0 ? dailyWageNet / dailySeconds : 0
  return { segs, wd, dailySeconds, dailyWage, dailyWageNet, perSec, perSecNet }
}

export function fmtMoney(n) {
  return '¥' + (Number(n) || 0).toFixed(2)
}
