import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  CheckCheck,
  Filter,
  CircleDot,
  AlertTriangle,
  FileText,
  TrendingUp,
  Settings,
  Inbox,
} from 'lucide-react'
import useStore from '../store/useStore'
import { MESSAGE_TYPES, MESSAGE_LEVELS } from '../constants'
import { formatTime } from '../utils/format'

const TYPE_ICON = {
  审批: Settings,
  预警: AlertTriangle,
  进度: TrendingUp,
  报告: FileText,
  系统: Bell,
}

export default function Messages() {
  const navigate = useNavigate()
  const messages = useStore((s) => s.messages)
  const markMessageRead = useStore((s) => s.markMessageRead)
  const markAllMessagesRead = useStore((s) => s.markAllMessagesRead)

  const [filter, setFilter] = useState('全部')

  const filtered = useMemo(() => {
    const list = filter === '全部' ? messages : messages.filter((m) => m.type === filter)
    return [...list].sort((a, b) => new Date(b.at) - new Date(a.at))
  }, [messages, filter])

  const unread = messages.filter((m) => !m.read).length

  function handleClick(m) {
    if (!m.read) markMessageRead(m.id)
    if (m.link) navigate(m.link)
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            消息中心
            {unread > 0 && <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">{unread} 未读</span>}
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">审批、预警、进度、报告与系统通知统一收件箱</p>
        </div>
        {unread > 0 && (
          <button onClick={markAllMessagesRead} className="flex items-center gap-1.5 text-sm text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg">
            <CheckCheck size={15} /> 全部已读
          </button>
        )}
      </div>

      {/* 过滤 */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <span className="text-xs text-slate-400 flex items-center gap-1"><Filter size={12} />类型</span>
        {['全部', ...MESSAGE_TYPES].map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filter === t ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Inbox size={40} className="mb-3 text-slate-200" />
            <p className="text-sm">暂无消息</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {filtered.map((m) => {
              const Icon = TYPE_ICON[m.type] || Bell
              const level = MESSAGE_LEVELS[m.level] || MESSAGE_LEVELS.P2
              return (
                <button
                  key={m.id}
                  onClick={() => handleClick(m)}
                  className={`w-full text-left px-5 py-3.5 flex items-start gap-3 transition-colors hover:bg-slate-50 ${m.read ? '' : 'bg-blue-50/40'}`}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${m.read ? 'bg-slate-100 text-slate-400' : 'bg-blue-100 text-blue-600'}`}>
                    <Icon size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-800 truncate">{m.title}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded text-white ${level.color}`}>{level.label}</span>
                      {!m.read && <CircleDot size={12} className="text-blue-500 flex-shrink-0" />}
                    </div>
                    {m.body && <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{m.body}</p>}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] text-slate-400">{m.type}</span>
                      <span className="text-[11px] text-slate-300">·</span>
                      <span className="text-[11px] text-slate-400">{formatTime(m.at)}</span>
                      {m.link && <span className="text-[11px] text-blue-500 ml-auto">查看 →</span>}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
