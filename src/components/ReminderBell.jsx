import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, AlertCircle, Clock, CalendarClock, MessageSquare } from 'lucide-react'
import useStore from '../store/useStore'
import { useReminders, fireDesktopNotification } from '../utils/reminders'

const GROUP_ICON = { overdue: AlertCircle, today: Clock, tomorrow: CalendarClock, week: CalendarClock }

export default function ReminderBell() {
  const { reminders, counts } = useReminders()
  const messages = useStore((s) => s.messages)
  const notificationsEnabled = useStore((s) => s.prefs.notificationsEnabled)
  const markMessageRead = useStore((s) => s.markMessageRead)
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (notificationsEnabled) fireDesktopNotification(counts)
  }, [notificationsEnabled])

  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const unread = messages.filter((m) => !m.read).length
  const total = counts.total + unread
  const danger = counts.overdue + counts.today > 0 || messages.some((m) => !m.read && m.level === 'P0')

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-colors"
        aria-label="提醒与消息"
      >
        <Bell size={18} />
        {total > 0 && (
          <span
            className={`absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold flex items-center justify-center ${
              danger ? 'bg-red-500 text-white' : 'bg-slate-500 text-white'
            }`}
          >
            {total}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <span className="font-semibold text-slate-800">提醒与消息</span>
            <button onClick={() => { setOpen(false); navigate('/messages') }} className="text-xs text-blue-600 hover:underline">
              查看全部
            </button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {total === 0 ? (
              <div className="px-4 py-8 text-center text-slate-400 text-sm">暂无待办与消息 🎉</div>
            ) : (
              <>
                {reminders.map((r) => {
                  const Icon = GROUP_ICON[r.type]
                  return (
                    <button
                      key={r.id}
                      onClick={() => { setOpen(false); navigate('/tasks') }}
                      className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-50 flex items-start gap-3"
                    >
                      <span className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${r.dot}`} />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm text-slate-800 truncate">{r.title}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-xs ${r.tone}`}>{r.label}</span>
                          {r.customerName && <span className="text-xs text-slate-400 truncate">· {r.customerName}</span>}
                          <span className="text-xs text-slate-300 ml-auto">{r.date}</span>
                        </div>
                      </div>
                    </button>
                  )
                })}
                {messages.filter((m) => !m.read).slice(0, 4).map((m) => (
                  <button
                    key={m.id}
                    onClick={() => { markMessageRead(m.id); setOpen(false); navigate(m.link || '/messages') }}
                    className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-50 flex items-start gap-3"
                  >
                    <MessageSquare size={14} className="mt-1 text-blue-500 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-slate-800 truncate">{m.title}</div>
                      <div className="text-xs text-slate-400 truncate mt-0.5">{m.body}</div>
                    </div>
                  </button>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
