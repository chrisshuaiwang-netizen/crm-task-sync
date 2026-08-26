import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Sparkles, Bot, LogOut } from 'lucide-react'
import useStore from '../store/useStore'
import ReminderBell from './ReminderBell'

const SUGGESTIONS = ['华夏银行要加一个智能质检需求，优先级高', '记一场客户会议纪要，并提取待办', '出一份本周工作周报']

export default function TopBar() {
  const navigate = useNavigate()
  const logout = useStore((s) => s.logout)
  const currentUser = useStore((s) => s.currentUser)
  const org = useStore((s) => s.org)
  const me = org.members.find((m) => m.id === org.currentMemberId)
  const [q, setQ] = useState('')

  function dispatch(text) {
    const clean = (text || '').trim()
    if (!clean) return
    navigate(`/assistant?q=${encodeURIComponent(clean)}`)
  }

  return (
    <header className="hidden md:flex sticky top-0 z-30 h-14 bg-white/90 backdrop-blur border-b border-slate-200 items-center gap-3 px-5">
      {/* 全局 Agent 命令栏 */}
      <form
        onSubmit={(e) => { e.preventDefault(); dispatch(q) }}
        className="flex-1 max-w-2xl flex items-center gap-2 bg-slate-100 hover:bg-slate-200/70 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500 rounded-xl px-3 py-2 transition-all"
      >
        <Sparkles size={16} className="text-blue-500 flex-shrink-0" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="和 Agent 说句话：建任务 / 录需求 / 加客户 / 写纪要 / 出报告…"
          className="flex-1 bg-transparent text-sm text-slate-700 placeholder-slate-400 focus:outline-none"
        />
        <button type="submit" className="text-blue-600 text-xs font-medium px-2 py-1 rounded-lg hover:bg-blue-50 flex items-center gap-1">
          <Search size={13} /> 执行
        </button>
      </form>

      {/* 右侧：建议 + 消息 + 用户 */}
      <div className="flex items-center gap-2 ml-auto">
        <button
          onClick={() => dispatch(SUGGESTIONS[Math.floor(Math.random() * SUGGESTIONS.length)])}
          className="hidden lg:flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 border border-slate-200 hover:border-blue-300 rounded-lg px-2.5 py-1.5 transition-colors"
          title="让我帮你做一件示例任务"
        >
          <Bot size={13} /> 帮我做
        </button>
        <ReminderBell />
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-7 h-7 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center flex-shrink-0">
            {(me?.name || currentUser || '我').slice(0, 1)}
          </div>
          <span className="text-sm text-slate-600 max-w-[80px] truncate">{me?.name || currentUser || '我'}</span>
          <button
            onClick={logout}
            title="退出登录"
            className="p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-lg transition-colors"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </header>
  )
}
