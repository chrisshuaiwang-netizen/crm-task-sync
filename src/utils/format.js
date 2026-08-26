/**
 * 通用格式化工具
 */

/** 相对时间：刚刚 / X 小时前 / X 天前 / 月日 */
export function formatTime(isoStr) {
  if (!isoStr) return ''
  const d = new Date(isoStr)
  const now = new Date()
  const diffMs = now - d
  const diffH = Math.floor(diffMs / 3600000)
  const diffD = Math.floor(diffMs / 86400000)
  if (diffH < 1) return '刚刚'
  if (diffH < 24) return `${diffH} 小时前`
  if (diffD < 7) return `${diffD} 天前`
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

/** 日期标签：今天 / 昨天 / X天前 / 月日 */
export function formatDateShort(isoStr) {
  if (!isoStr) return ''
  const d = new Date(isoStr)
  const now = new Date()
  const diffD = Math.floor((now - d) / 86400000)
  if (diffD === 0) return '今天'
  if (diffD === 1) return '昨天'
  if (diffD < 7) return `${diffD}天前`
  return d.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })
}

/** 今日日期字符串 YYYY-MM-DD */
export function getTodayStr() {
  return new Date().toISOString().split('T')[0]
}

/** 中文长日期，含星期 */
export function getChineseDate() {
  return new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })
}

/** YYYY-MM-DD → M月D日 */
export function formatDateCN(dateStr) {
  if (!dateStr) return ''
  const [, m, d] = dateStr.split('-').map(Number)
  return `${m}月${d}日`
}

/** 本周范围（周一~周日），返回 { start, end } YYYY-MM-DD */
export function getWeekRange(ref = new Date()) {
  const d = new Date(ref)
  const wd = (d.getDay() + 6) % 7
  const mon = new Date(d)
  mon.setDate(d.getDate() - wd)
  const sun = new Date(mon)
  sun.setDate(mon.getDate() + 6)
  const f = (x) => `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`
  return { start: f(mon), end: f(sun) }
}

/** 本月范围 */
export function getMonthRange(ref = new Date()) {
  const y = ref.getFullYear()
  const m = ref.getMonth()
  const f = (x) => `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`
  return { start: f(new Date(y, m, 1)), end: f(new Date(y, m + 1, 0)) }
}

/** 本年范围 */
export function getYearRange(ref = new Date()) {
  const y = ref.getFullYear()
  return { start: `${y}-01-01`, end: `${y}-12-31` }
}

/** dateStr 是否落在闭区间 [start, end]（YYYY-MM-DD） */
export function inRange(dateStr, start, end) {
  if (!dateStr) return false
  return dateStr >= start && dateStr <= end
}

/** 列出区间 [start, end] 内所有日期（含），返回 YYYY-MM-DD 数组 */
export function eachDay(start, end) {
  const out = []
  const cur = new Date(start)
  const last = new Date(end)
  const f = (x) => `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`
  while (cur <= last) {
    out.push(f(cur))
    cur.setDate(cur.getDate() + 1)
  }
  return out
}
