import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ClipboardList,
  Users,
  ListChecks,
  CheckCircle2,
  ArrowRight,
  Clock,
  Plus,
  TrendingUp,
  AlertCircle,
  Building2,
  CalendarDays,
  CalendarCheck,
  Sparkles,
  Bot,
  Zap,
  FileWarning,
  Flame,
} from 'lucide-react'
import useStore from '../store/useStore'
import { PRIORITY_BADGE, STATUS_CONFIG, ACTIVE_STATUSES, getPermissions, filterByVisibility } from '../constants'
import {
  getChineseDate,
  getTodayStr,
  getWeekRange,
  eachDay,
  formatDateCN,
} from '../utils/format'

const WEEKDAY_LABELS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

export default function Dashboard() {
  const navigate = useNavigate()
  const allTasks = useStore((s) => s.tasks)
  const allCustomers = useStore((s) => s.customers)
  const allDeals = useStore((s) => s.deals)
  const workspace = useStore((s) => s.workspaces[s.activeWorkspaceId])

  const perms = getPermissions(workspace)
  const tasks = filterByVisibility(allTasks, workspace, (t) => t.ownerId)
  const customers = filterByVisibility(allCustomers, workspace, (c) => c.ownerId)
  const deals = filterByVisibility(allDeals, workspace, (d) => d.ownerId)

  const [q, setQ] = useState('')

  const todayStr = getTodayStr()
  const week = getWeekRange()
  const weekDays = eachDay(week.start, week.end)
  const tasksByDay = {}
  weekDays.forEach((d) => {
    tasksByDay[d] = tasks.filter((t) => t.scheduledDate === d)
  })

  const pendingTasks = tasks.filter((t) => t.status === '待启动')
  const STATUS_ORDER = { 待启动: 0, 进行中: 1, 已完成: 2, 已暂停: 3, 已取消: 4 }
  const activeTasks = tasks
    .filter((t) => ACTIVE_STATUSES.includes(t.status))
    .sort((a, b) => {
      const so = (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9)
      if (so !== 0) return so
      if (!a.deadline && !b.deadline) return 0
      if (!a.deadline) return 1
      if (!b.deadline) return -1
      return a.deadline.localeCompare(b.deadline)
    })
  const doneTasks = tasks.filter((t) => t.status === '已完成')

  const todayTasks = tasks.filter((t) => t.scheduledDate === todayStr)
  const todayDone = todayTasks.filter((t) => t.status === '已完成').length
  const todayProgress = todayTasks.length ? Math.round((todayDone / todayTasks.length) * 100) : 0

  const statCards = [
    { label: '今日排期', value: todayTasks.length, icon: CalendarDays, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
    { label: '进行中', value: activeTasks.length, icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
    { label: '客户数', value: customers.length, icon: Users, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' },
    { label: '已完成', value: doneTasks.length, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' },
  ]

  function getCustomerName(customerId) {
    const c = customers.find((c) => c.id === customerId)
    return c ? c.name : '未关联客户'
  }

  const customerStats = customers
    .map((c) => {
      const ct = tasks.filter((t) => t.customerId === c.id)
      const done = ct.filter((t) => t.status === '已完成').length
      const open = ct.filter((t) => t.status === '待启动' || t.status === '进行中').length
      const progress = ct.length ? Math.round((done / ct.length) * 100) : 0
      return { ...c, total: ct.length, done, open, progress }
    })
    .sort((a, b) => b.open - a.open)

  // ── Agent 自动洞察 ──
  const insights = (() => {
    const list = []
    const overdue = tasks.filter((t) => !['已完成', '已取消'].includes(t.status) && t.deadline && t.deadline < todayStr)
    const dueToday = tasks.filter((t) => !['已完成', '已取消'].includes(t.status) && t.deadline === todayStr)
    const earlyCustomers = customers.filter((c) => ['初步接触', '需求沟通'].includes(c.status))
    const riskDeals = deals.filter((d) => ['商务谈判', '方案验证'].includes(d.stage))
    const weekDone = weekDays.reduce((s, d) => s + (tasksByDay[d] || []).filter((t) => t.status === '已完成').length, 0)
    const weekTotal = weekDays.reduce((s, d) => s + (tasksByDay[d] || []).length, 0)
    const weekRate = weekTotal ? Math.round((weekDone / weekTotal) * 100) : 0

    if (overdue.length > 0) {
      list.push({
        id: 'overdue', level: 'danger', icon: FileWarning,
        title: `${overdue.length} 个任务已逾期`,
        desc: overdue.slice(0, 3).map((t) => `【${getCustomerName(t.customerId)}】${t.title}`).join('；') + (overdue.length > 3 ? ` 等` : ''),
        action: '去处理', to: '/tasks',
      })
    }
    if (dueToday.length > 0) {
      list.push({
        id: 'today', level: 'warn', icon: Clock,
        title: `今日有 ${dueToday.length} 个任务待推进`,
        desc: dueToday.slice(0, 3).map((t) => t.title).join('；'),
        action: '查看今日', to: '/tasks',
      })
    }
    if (earlyCustomers.length > 0) {
      list.push({
        id: 'early', level: 'warn', icon: Building2,
        title: `${earlyCustomers.length} 个客户处于早期阶段，建议推进`,
        desc: earlyCustomers.slice(0, 3).map((c) => `${c.name}（${c.status}）`).join('；'),
        action: '客户管理', to: '/customers',
      })
    }
    if (riskDeals.length > 0) {
      list.push({
        id: 'deal', level: 'info', icon: TrendingUp,
        title: `${riskDeals.length} 笔成单临近关键节点`,
        desc: riskDeals.slice(0, 3).map((d) => `${d.customerName || '未关联'} · ${d.stage}`).join('；'),
        action: '成单管理', to: '/deals',
      })
    }
    list.push({
      id: 'rate', level: 'info', icon: CalendarCheck,
      title: `本周任务完成率 ${weekRate}%`,
      desc: `本周排期 ${weekTotal} 项，已完成 ${weekDone} 项。`,
      action: '数据报表', to: '/data-report',
    })
    return list
  })()

  const LEVEL_STYLE = {
    danger: 'border-red-200 bg-red-50',
    warn: 'border-amber-200 bg-amber-50',
    info: 'border-blue-200 bg-blue-50',
  }
  const LEVEL_ICON = { danger: 'text-red-500', warn: 'text-amber-500', info: 'text-blue-500' }

  const QUICK = [
    { label: '➕ 一句话建任务', q: '帮我新建一个任务：' },
    { label: '📝 写会议纪要', q: '记录一场客户会议纪要，并提取待办转成任务' },
    { label: '📊 出本周周报', q: '生成本周工作周报' },
    { label: '🔍 查逾期任务', q: '列出本周逾期的任务' },
  ]

  function dispatch(text) {
    const clean = (text || '').trim()
    if (!clean) return
    navigate(`/assistant?q=${encodeURIComponent(clean)}`)
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Hero：对话式入口 */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 mb-6 text-white shadow-lg">
        <div className="flex items-center gap-2 mb-3">
          <Bot size={18} className="text-blue-400" />
          <span className="text-sm text-slate-300">Agent 工作台</span>
          <span className="text-[11px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full">自然语言驱动</span>
        </div>
        <h1 className="text-xl font-bold mb-1">有什么可以帮你做的？</h1>
        <p className="text-slate-400 text-sm mb-4">用一句话告诉 Agent：建任务、录需求、加客户、写纪要、出报告——它会先给你预览，确认后再执行。</p>
        <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2.5 border border-white/10 focus-within:ring-2 focus-within:ring-blue-500 transition-all">
          <Sparkles size={16} className="text-blue-400 flex-shrink-0" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && dispatch(q)}
            placeholder="例如：华夏银行要加一个智能质检需求，优先级高…"
            className="flex-1 bg-transparent text-sm text-white placeholder-slate-400 focus:outline-none"
          />
          <button
            onClick={() => dispatch(q)}
            className="flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
          >
            <Zap size={13} /> 让 Agent 执行
          </button>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {QUICK.map((item) => (
            <button
              key={item.label}
              onClick={() => dispatch(item.q)}
              className="text-xs text-slate-200 bg-white/5 hover:bg-white/15 border border-white/10 rounded-full px-3 py-1.5 transition-colors"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Agent 洞察 */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={16} className="text-blue-500" />
          <h2 className="font-semibold text-slate-800 text-base">Agent 今日洞察</h2>
          <span className="text-xs text-slate-400">基于当前数据自动生成</span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {insights.map((it) => {
            const Icon = it.icon
            return (
              <div key={it.id} className={`rounded-xl border p-4 ${LEVEL_STYLE[it.level]} flex items-start gap-3`}>
                <Icon size={18} className={`${LEVEL_ICON[it.level]} flex-shrink-0 mt-0.5`} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-slate-800">{it.title}</div>
                  <div className="text-xs text-slate-500 mt-1 line-clamp-2">{it.desc}</div>
                </div>
                <button
                  onClick={() => navigate(it.to)}
                  className="flex-shrink-0 text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-0.5"
                >
                  {it.action} <ArrowRight size={12} />
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* 业务概览 */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-slate-800 text-base">业务概览</h2>
        <span className="text-xs text-slate-400">{getChineseDate()}{perms.viewScope === 'mine' && ' · 仅显示你负责的任务'}</span>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((card) => (
          <div key={card.label} className={`bg-white rounded-xl p-4 border ${card.border} shadow-sm`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-500 text-sm">{card.label}</span>
              <div className={`w-9 h-9 rounded-lg ${card.bg} flex items-center justify-center`}>
                <card.icon size={18} className={card.color} />
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-800">{card.value}</div>
          </div>
        ))}
      </div>

      {/* 今日进度 + 本周趋势 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <CalendarCheck size={17} className="text-blue-500" />
              <h2 className="font-semibold text-slate-800 text-base">今日进度</h2>
              <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium">{todayTasks.length}</span>
            </div>
            <span className="text-xs text-slate-400">{todayProgress}% 完成</span>
          </div>
          {todayTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400">
              <CalendarDays size={30} className="mb-2 text-slate-200" />
              <p className="text-sm">今天没有排期任务，享受一下？</p>
            </div>
          ) : (
            <>
              <div className="px-5 py-3">
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${todayProgress}%` }} />
                </div>
              </div>
              <div className="divide-y divide-slate-50">
                {todayTasks.map((task) => (
                  <div key={task.id} className="px-5 py-3 hover:bg-slate-50 cursor-pointer transition-colors" onClick={() => navigate('/tasks')}>
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-slate-800 leading-snug line-clamp-1 flex-1">{task.title}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${STATUS_CONFIG[task.status]?.badge}`}>{task.status}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-xs text-slate-400">{getCustomerName(task.customerId)}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded flex-shrink-0 ${PRIORITY_BADGE[task.priority]}`}>{task.priority}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <TrendingUp size={17} className="text-indigo-500" />
              <h2 className="font-semibold text-slate-800 text-base">本周趋势</h2>
            </div>
            <span className="text-xs text-slate-400">{formatDateCN(week.start)} - {formatDateCN(week.end)}</span>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-7 gap-2">
              {weekDays.map((day, i) => {
                const dt = tasksByDay[day] || []
                const done = dt.filter((t) => t.status === '已完成').length
                const isToday = day === todayStr
                return (
                  <div key={day} className={`rounded-lg p-2 text-center transition-colors ${isToday ? 'bg-blue-50 border border-blue-200' : 'bg-slate-50'}`}>
                    <div className="text-xs text-slate-500 font-medium">{WEEKDAY_LABELS[i]}</div>
                    <div className="text-[10px] text-slate-400">{formatDateCN(day)}</div>
                    <div className="text-xl font-bold text-slate-800 mt-1.5">{dt.length}</div>
                    <div className="text-[11px] text-green-600">{done} 完成</div>
                  </div>
                )
              })}
            </div>
            <div className="flex items-center gap-2 mt-4 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              每天数字为「排期任务数」，绿色为已完成数
            </div>
          </div>
        </div>
      </div>

      {/* Two-column: pending + active */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <AlertCircle size={17} className="text-orange-500" />
              <h2 className="font-semibold text-slate-800 text-base">待启动任务</h2>
              <span className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full font-medium">{pendingTasks.length}</span>
            </div>
            <button onClick={() => navigate('/tasks')} className="text-blue-600 text-xs flex items-center gap-1 hover:text-blue-800 transition-colors">
              查看全部 <ArrowRight size={13} />
            </button>
          </div>
          <div className="divide-y divide-slate-50">
            {pendingTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <CheckCircle2 size={32} className="mb-2 text-green-300" />
                <p className="text-sm">暂无待启动任务，太棒了！</p>
              </div>
            ) : (
              pendingTasks.slice(0, 5).map((task) => (
                <div key={task.id} className="px-5 py-3.5 hover:bg-slate-50 cursor-pointer transition-colors" onClick={() => navigate('/tasks')}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-slate-800 leading-snug line-clamp-1 flex-1">{task.title}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${PRIORITY_BADGE[task.priority]}`}>{task.priority}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-xs text-slate-400">{getCustomerName(task.customerId)}</span>
                    {task.deadline && <span className="text-xs text-slate-400 ml-auto flex items-center gap-1"><Clock size={11} />{task.deadline}</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Flame size={17} className="text-blue-500" />
              <h2 className="font-semibold text-slate-800 text-base">进行中任务</h2>
              <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium">{activeTasks.length}</span>
            </div>
            <button onClick={() => navigate('/tasks')} className="text-blue-600 text-xs flex items-center gap-1 hover:text-blue-800 transition-colors">
              查看全部 <ArrowRight size={13} />
            </button>
          </div>
          <div className="divide-y divide-slate-50">
            {activeTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <ClipboardList size={32} className="mb-2 text-slate-200" />
                <p className="text-sm">暂无进行中的任务</p>
              </div>
            ) : (
              activeTasks.slice(0, 5).map((task) => (
                <div key={task.id} className="px-5 py-3.5 hover:bg-slate-50 cursor-pointer transition-colors" onClick={() => navigate('/tasks')}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-slate-800 leading-snug line-clamp-1 flex-1">{task.title}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${STATUS_CONFIG[task.status]?.badge}`}>{task.status}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-xs text-slate-400">{getCustomerName(task.customerId)}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded flex-shrink-0 ${PRIORITY_BADGE[task.priority]}`}>{task.priority}</span>
                    {task.deadline && (
                      <span className="text-xs text-slate-400 ml-auto flex items-center gap-1"><Clock size={11} />截止 {task.deadline}</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Customer situation */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Building2 size={17} className="text-orange-500" />
            <h2 className="font-semibold text-slate-800 text-base">客户情况</h2>
            <span className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full font-medium">{customers.length}</span>
          </div>
          <button onClick={() => navigate('/customers')} className="text-blue-600 text-xs flex items-center gap-1 hover:text-blue-800 transition-colors">
            客户管理 <ArrowRight size={13} />
          </button>
        </div>
        <div className="divide-y divide-slate-50">
          {customerStats.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400">
              <Users size={30} className="mb-2 text-slate-200" />
              <p className="text-sm">暂无客户</p>
            </div>
          ) : (
            customerStats.map((c) => (
              <div key={c.id} className="px-5 py-3 flex items-center gap-3 hover:bg-slate-50 cursor-pointer transition-colors" onClick={() => navigate('/customers')}>
                <div className="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0" />
                <span className="text-sm font-medium text-slate-800 flex-1 truncate">{c.name}</span>
                <span className="text-xs text-slate-400 flex-shrink-0">{c.industry}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${PRIORITY_BADGE[c.priority]}`}>{c.priority}</span>
                <div className="flex flex-col items-end flex-shrink-0 w-28">
                  <span className="text-xs text-slate-500">
                    共 {c.total} · <span className="text-green-600 font-medium">{c.done}</span> 完成 · <span className="text-orange-600">{c.open}</span> 进行
                  </span>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1">
                    <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${c.progress}%` }} />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
