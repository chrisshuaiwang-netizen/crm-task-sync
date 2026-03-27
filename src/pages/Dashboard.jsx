import { useNavigate } from 'react-router-dom'
import {
  ClipboardList,
  Users,
  FileText,
  CheckCircle2,
  ArrowRight,
  Clock,
  Plus,
  TrendingUp,
  AlertCircle,
} from 'lucide-react'
import useStore from '../store/useStore'

const PRIORITY_BADGE = {
  高: 'bg-red-100 text-red-700 border border-red-200',
  中: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
  低: 'bg-green-100 text-green-700 border border-green-200',
}

const STATUS_BADGE = {
  待处理: 'bg-slate-100 text-slate-600',
  进行中: 'bg-blue-100 text-blue-700',
  已完成: 'bg-green-100 text-green-700',
}

function formatTime(isoStr) {
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

function getChineseDate() {
  const now = new Date()
  return now.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })
}

function getTodayStr() {
  return new Date().toISOString().split('T')[0]
}

function getWeekStart() {
  const d = new Date()
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { requirements, tasks, customers } = useStore()

  const todayStr = getTodayStr()
  const weekStart = getWeekStart()

  const pendingReqs = requirements.filter((r) => r.status === '待评审')
  const todayTasks = tasks.filter((t) => t.date === todayStr)
  const weekCompletedTasks = tasks.filter(
    (t) => t.status === '已完成' && new Date(t.date) >= weekStart
  )

  const statCards = [
    {
      label: '今日待处理',
      value: todayTasks.filter((t) => t.status !== '已完成').length,
      icon: ClipboardList,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-100',
    },
    {
      label: '总需求数',
      value: requirements.length,
      icon: FileText,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      border: 'border-purple-100',
    },
    {
      label: '客户总数',
      value: customers.length,
      icon: Users,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      border: 'border-orange-100',
    },
    {
      label: '本周完成',
      value: weekCompletedTasks.length,
      icon: CheckCircle2,
      color: 'text-green-600',
      bg: 'bg-green-50',
      border: 'border-green-100',
    },
  ]

  function getCustomerName(customerId) {
    const c = customers.find((c) => c.id === customerId)
    return c ? c.name : '未关联客户'
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">工作台</h1>
          <p className="text-slate-500 text-sm mt-0.5">{getChineseDate()}</p>
        </div>
        <button
          onClick={() => navigate('/inbox')}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          快速记录需求
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((card) => (
          <div
            key={card.label}
            className={`bg-white rounded-xl p-4 border ${card.border} shadow-sm`}
          >
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

      {/* Two-column content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Requirements */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <AlertCircle size={17} className="text-orange-500" />
              <h2 className="font-semibold text-slate-800 text-base">待处理需求</h2>
              <span className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full font-medium">
                {pendingReqs.length}
              </span>
            </div>
            <button
              onClick={() => navigate('/inbox')}
              className="text-blue-600 text-xs flex items-center gap-1 hover:text-blue-800 transition-colors"
            >
              查看全部 <ArrowRight size={13} />
            </button>
          </div>
          <div className="divide-y divide-slate-50">
            {pendingReqs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <CheckCircle2 size={32} className="mb-2 text-green-300" />
                <p className="text-sm">暂无待处理需求，太棒了！</p>
              </div>
            ) : (
              pendingReqs.slice(0, 5).map((req) => (
                <div
                  key={req.id}
                  className="px-5 py-3.5 hover:bg-slate-50 cursor-pointer transition-colors"
                  onClick={() => navigate('/inbox')}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-slate-800 leading-snug line-clamp-1 flex-1">
                      {req.title}
                    </p>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${PRIORITY_BADGE[req.priority]}`}
                    >
                      {req.priority}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-xs text-slate-400">{getCustomerName(req.customerId)}</span>
                    {req.tags && req.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                    <span className="text-xs text-slate-400 ml-auto flex items-center gap-1">
                      <Clock size={11} />
                      {formatTime(req.createdAt)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Today's Tasks */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <TrendingUp size={17} className="text-blue-500" />
              <h2 className="font-semibold text-slate-800 text-base">今日任务</h2>
              <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium">
                {todayTasks.length}
              </span>
            </div>
            <button
              onClick={() => navigate('/schedule')}
              className="text-blue-600 text-xs flex items-center gap-1 hover:text-blue-800 transition-colors"
            >
              查看计划 <ArrowRight size={13} />
            </button>
          </div>
          <div className="divide-y divide-slate-50">
            {todayTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <ClipboardList size={32} className="mb-2 text-slate-200" />
                <p className="text-sm">今日暂无任务安排</p>
                <button
                  onClick={() => navigate('/schedule')}
                  className="mt-2 text-blue-500 text-xs hover:underline"
                >
                  添加今日任务
                </button>
              </div>
            ) : (
              todayTasks.map((task) => (
                <div
                  key={task.id}
                  className="px-5 py-3.5 hover:bg-slate-50 cursor-pointer transition-colors"
                  onClick={() => navigate('/schedule')}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className={`text-sm font-medium leading-snug line-clamp-1 flex-1 ${
                        task.status === '已完成' ? 'line-through text-slate-400' : 'text-slate-800'
                      }`}
                    >
                      {task.title}
                    </p>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${STATUS_BADGE[task.status]}`}
                    >
                      {task.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    {task.customerId && (
                      <span className="text-xs text-slate-400">{getCustomerName(task.customerId)}</span>
                    )}
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded flex-shrink-0 ${PRIORITY_BADGE[task.priority]}`}
                    >
                      {task.priority}优先级
                    </span>
                    <span className="text-xs text-slate-400 ml-auto flex items-center gap-1">
                      <Clock size={11} />
                      {task.hours}h
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
