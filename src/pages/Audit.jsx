import { useState, useMemo } from 'react'
import { History, Filter, UserCog, FilePlus2, RefreshCw, Trash2, ShieldAlert } from 'lucide-react'
import useStore from '../store/useStore'
import { formatTime } from '../utils/format'

const ACTION_META = {
  初始化: { icon: FilePlus2, color: 'text-slate-500', bg: 'bg-slate-100' },
  创建: { icon: FilePlus2, color: 'text-green-600', bg: 'bg-green-50' },
  新增: { icon: UserCog, color: 'text-blue-600', bg: 'bg-blue-50' },
  删除: { icon: Trash2, color: 'text-red-600', bg: 'bg-red-50' },
  更新: { icon: RefreshCw, color: 'text-blue-600', bg: 'bg-blue-50' },
  状态变更: { icon: RefreshCw, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  拆解: { icon: RefreshCw, color: 'text-violet-600', bg: 'bg-violet-50' },
  待办转任务: { icon: RefreshCw, color: 'text-pink-600', bg: 'bg-pink-50' },
  批量创建: { icon: FilePlus2, color: 'text-green-600', bg: 'bg-green-50' },
}

export default function Audit() {
  const auditLog = useStore((s) => s.auditLog)
  const [filter, setFilter] = useState('全部')

  const actions = useMemo(() => ['全部', ...Array.from(new Set(auditLog.map((a) => a.action)))], [auditLog])

  const filtered = useMemo(() => {
    const list = filter === '全部' ? auditLog : auditLog.filter((a) => a.action === filter)
    return [...list].sort((a, b) => new Date(b.at) - new Date(a.at))
  }, [auditLog, filter])

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <History size={22} className="text-blue-600" />
            审计日志
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">所有关键操作的留痕，便于追溯与合规</p>
        </div>
      </div>

      {/* 过滤 */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <span className="text-xs text-slate-400 flex items-center gap-1"><Filter size={12} />操作</span>
        {actions.map((a) => (
          <button
            key={a}
            onClick={() => setFilter(a)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filter === a ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            {a}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <ShieldAlert size={40} className="mb-3 text-slate-200" />
            <p className="text-sm">暂无审计记录</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {filtered.map((a) => {
              const meta = ACTION_META[a.action] || { icon: RefreshCw, color: 'text-slate-500', bg: 'bg-slate-100' }
              const Icon = meta.icon
              return (
                <div key={a.id} className="px-5 py-3.5 flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${meta.bg}`}>
                    <Icon size={16} className={meta.color} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-slate-800">{a.action}</span>
                      <span className="text-sm text-slate-600">{a.target}</span>
                      <span className="text-[11px] text-slate-300 ml-auto">{formatTime(a.at)}</span>
                    </div>
                    {a.detail && <p className="text-xs text-slate-500 mt-0.5">{a.detail}</p>}
                    <div className="text-[11px] text-slate-400 mt-0.5">操作人：{a.actor}</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
      <p className="text-slate-400 text-xs mt-4">共 {auditLog.length} 条记录 · 数据仅保存在当前浏览器本地（LocalStorage）。</p>
    </div>
  )
}
