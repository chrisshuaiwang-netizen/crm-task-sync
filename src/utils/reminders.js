import { useMemo } from 'react'
import useStore from '../store/useStore'

const startOfDay = (d) => {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}
const dayDiff = (dateStr, base) => {
  if (!dateStr) return null
  const d = startOfDay(new Date(dateStr + 'T00:00:00'))
  return Math.round((d - startOfDay(base)) / 86400000)
}

const TYPE_META = {
  overdue: { label: '已逾期', tone: 'text-red-600', bg: 'bg-red-50', dot: 'bg-red-500' },
  today: { label: '今天到期', tone: 'text-orange-600', bg: 'bg-orange-50', dot: 'bg-orange-500' },
  tomorrow: { label: '明天到期', tone: 'text-amber-600', bg: 'bg-amber-50', dot: 'bg-amber-500' },
  week: { label: '本周内', tone: 'text-blue-600', bg: 'bg-blue-50', dot: 'bg-blue-500' },
}

// 基于任务截止日/排期日生成提醒
export function buildReminders(tasks, today = new Date()) {
  const result = []
  for (const t of tasks) {
    if (t.status === '已完成' || t.status === '已取消') continue
    const d = t.deadline || t.scheduledDate
    const diff = dayDiff(d, today)
    if (diff === null) continue
    let type
    if (diff < 0) type = 'overdue'
    else if (diff === 0) type = 'today'
    else if (diff === 1) type = 'tomorrow'
    else if (diff <= 7) type = 'week'
    else continue
    result.push({
      id: t.id,
      taskId: t.id,
      title: t.title,
      customerName: t.customerName,
      date: d,
      days: diff,
      type,
      ...TYPE_META[type],
    })
  }
  result.sort((a, b) => a.days - b.days)
  return result
}

export function useReminders() {
  const tasks = useStore((s) => s.tasks)
  const reminders = useMemo(() => buildReminders(tasks), [tasks])
  const counts = useMemo(
    () => ({
      total: reminders.length,
      overdue: reminders.filter((r) => r.type === 'overdue').length,
      today: reminders.filter((r) => r.type === 'today').length,
      soon: reminders.filter((r) => r.type === 'tomorrow' || r.type === 'week').length,
    }),
    [reminders]
  )
  return { reminders, counts }
}

// 浏览器桌面通知
let notifiedThisSession = false
export function fireDesktopNotification(counts) {
  if (typeof window === 'undefined' || !('Notification' in window)) return
  if (Notification.permission !== 'granted') return
  if (notifiedThisSession) return
  notifiedThisSession = true
  const n = counts.overdue + counts.today
  if (n === 0) return
  const body =
    counts.overdue > 0
      ? `有 ${counts.overdue} 项已逾期，${counts.today} 项今天到期`
      : `${counts.today} 项任务今天到期`
  try {
    new Notification('工作管家 · 待办提醒', { body })
  } catch {
    /* 部分浏览器需用户手势触发，忽略 */
  }
}

export function requestNotificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) return Promise.resolve('denied')
  if (Notification.permission === 'granted') return Promise.resolve('granted')
  return Notification.requestPermission()
}
