import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart3,
  TrendingUp,
  Users,
  ClipboardList,
  PieChart,
  Filter,
  ArrowUpRight,
} from 'lucide-react'
import useStore from '../store/useStore'
import {
  CUSTOMER_STATUSES,
  TASK_STATUSES,
  DEAL_STAGES,
  getPermissions,
  filterByVisibility,
} from '../constants'

function StatCard({ label, value, icon: Icon, color, bg }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-slate-500 text-sm">{label}</span>
        <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>
          <Icon size={16} className={color} />
        </div>
      </div>
      <div className="text-2xl font-bold text-slate-800">{value}</div>
    </div>
  )
}

function BarRow({ label, value, total, color = 'bg-blue-500' }) {
  const pct = total ? Math.round((value / total) * 100) : 0
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-24 text-slate-600 truncate flex-shrink-0">{label}</span>
      <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-16 text-right text-slate-500 text-xs">{value} · {pct}%</span>
    </div>
  )
}

function MiniDonut({ data }) {
  // 简易 CSS 环形：用 conic-gradient（用 reduce 累积角度，避免渲染期变量重赋值）
  const total = data.reduce((s, d) => s + d.value, 0) || 1
  const { stops } = data.reduce(
    (acc, d) => {
      const start = (acc.angle / total) * 360
      const end = ((acc.angle + d.value) / total) * 360
      acc.stops.push(`${d.color} ${start}deg ${end}deg`)
      acc.angle += d.value
      return acc
    },
    { stops: [], angle: 0 }
  )
  return (
    <div className="flex items-center gap-4">
      <div
        className="w-24 h-24 rounded-full flex-shrink-0"
        style={{ background: `conic-gradient(${stops.join(',')})` }}
      />
      <div className="space-y-1.5">
        {data.map((d) => (
          <div key={d.label} className="flex items-center gap-2 text-xs">
            <span className="w-3 h-3 rounded-full" style={{ background: d.color }} />
            <span className="text-slate-600">{d.label}</span>
            <span className="text-slate-400 ml-auto">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function DataReport() {
  const store = useStore()
  const { customers, tasks, deals, requirements } = store
  const workspace = store.workspaces[store.activeWorkspaceId]
  const perms = getPermissions(workspace)
  const navigate = useNavigate()

  const [dim, setDim] = useState('customer')

  const vTasks = useMemo(() => filterByVisibility(tasks, workspace, (t) => t.ownerId), [tasks, workspace])
  const vCustomers = useMemo(() => filterByVisibility(customers, workspace, (c) => c.ownerId), [customers, workspace])

  // 用状态色映射为 hex（简单映射）
  const STATUS_HEX = {
    初步接触: '#94a3b8', 需求沟通: '#0ea5e9', 方案输出: '#6366f1', 商务谈判: '#f59e0b',
    已成单: '#22c55e', 已流失: '#ef4444',
    待启动: '#cbd5e1', 进行中: '#3b82f6', 已完成: '#22c55e', 已暂停: '#9ca3af', 已取消: '#f87171',
    初步接触2: '', 合同评审: '#8b5cf6', 已成交: '#16a34a', 方案报价: '#38bdf8', 商务谈判2: '',
  }
  const funnelData = CUSTOMER_STATUSES.map((st) => ({ label: st, value: vCustomers.filter((c) => c.status === st).length, color: STATUS_HEX[st] }))
  const dealData = DEAL_STAGES.map((st) => ({ label: st, value: deals.filter((d) => d.stage === st).length, color: STATUS_HEX[st] || '#94a3b8' }))

  // ── 任务状态分布 ──
  const taskStatusData = TASK_STATUSES.map((st) => ({ label: st, value: vTasks.filter((t) => t.status === st).length }))

  // ── 客户任务负载（按客户任务数）──
  const loadByCustomer = vCustomers
    .map((c) => ({ name: c.name, value: vTasks.filter((t) => t.customerId === c.id).length }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)
  const maxLoad = Math.max(1, ...loadByCustomer.map((d) => d.value))

  const totalTasks = vTasks.length
  const doneTasks = vTasks.filter((t) => t.status === '已完成').length
  const activeTasks = vTasks.filter((t) => t.status === '进行中').length
  const pendingTasks = vTasks.filter((t) => t.status === '待启动').length
  const overdueTasks = vTasks.filter((t) => t.deadline && t.status !== '已完成' && t.deadline < new Date().toISOString().slice(0, 10)).length
  const totalDealAmount = deals.filter((d) => d.status === '进行中').reduce((s, d) => s + (d.amount || 0), 0)
  const wonAmount = deals.filter((d) => d.stage === '已成交').reduce((s, d) => s + (d.amount || 0), 0)

  const priorityDist = ['高', '中', '低'].map((p) => ({ label: p, value: vTasks.filter((t) => t.priority === p).length }))

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">数据报表中心</h1>
          <p className="text-slate-500 text-sm mt-0.5">多维度统计客户、任务、成单与人效{perms.viewScope === 'mine' && ' · 仅统计你负责的数据'}</p>
        </div>
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
          {[
            { k: 'customer', label: '客户视角' },
            { k: 'task', label: '任务视角' },
            { k: 'deal', label: '成单视角' },
          ].map((o) => (
            <button key={o.k} onClick={() => setDim(o.k)} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${dim === o.k ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{o.label}</button>
          ))}
        </div>
      </div>

      {/* 概览卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="客户总数" value={vCustomers.length} icon={Users} color="text-orange-600" bg="bg-orange-50" />
        <StatCard label="进行中任务" value={activeTasks} icon={ClipboardList} color="text-blue-600" bg="bg-blue-50" />
        <StatCard label="在谈金额(万)" value={totalDealAmount} icon={TrendingUp} color="text-green-600" bg="bg-green-50" />
        <StatCard label="逾期任务" value={overdueTasks} icon={BarChart3} color="text-red-600" bg="bg-red-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* 客户状态漏斗 / 成单阶段 */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <PieChart size={16} className="text-indigo-500" />
            <h2 className="font-semibold text-slate-800 text-base">{dim === 'deal' ? '成单阶段分布' : '客户状态分布'}</h2>
          </div>
          <MiniDonut data={dim === 'deal' ? dealData : funnelData} />
        </div>

        {/* 任务状态分布 */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={16} className="text-blue-500" />
            <h2 className="font-semibold text-slate-800 text-base">任务状态分布</h2>
          </div>
          <div className="space-y-3">
            {taskStatusData.map((d) => (
              <BarRow key={d.label} label={d.label} value={d.value} total={totalTasks} color={STATUS_HEX[d.label] || 'bg-blue-500'} />
            ))}
            <div className="pt-2 flex items-center gap-4 text-xs text-slate-400">
              <span>总计 {totalTasks}</span>
              <span className="text-green-600">完成 {doneTasks}</span>
              <span className="text-blue-600">进行中 {activeTasks}</span>
              <span className="text-slate-400">待启动 {pendingTasks}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 客户任务负载 */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users size={16} className="text-orange-500" />
            <h2 className="font-semibold text-slate-800 text-base">客户任务负载 TOP8</h2>
          </div>
          <div className="space-y-3">
            {loadByCustomer.length === 0 && <div className="text-sm text-slate-300">暂无数据</div>}
            {loadByCustomer.map((d) => (
              <BarRow key={d.name} label={d.name} value={d.value} total={maxLoad} color="bg-orange-400" />
            ))}
          </div>
        </div>

        {/* 优先级分布 + 成单金额 */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Filter size={16} className="text-violet-500" />
            <h2 className="font-semibold text-slate-800 text-base">优先级分布 & 成单</h2>
          </div>
          <div className="space-y-3 mb-4">
            {priorityDist.map((d) => (
              <BarRow key={d.label} label={`${d.label}优先级`} value={d.value} total={totalTasks} color={d.label === '高' ? 'bg-red-400' : d.label === '中' ? 'bg-yellow-400' : 'bg-green-400'} />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
            <div className="bg-green-50 rounded-lg p-3">
              <div className="text-xs text-slate-500">已成交金额(万)</div>
              <div className="text-xl font-bold text-green-600">{wonAmount}</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="text-xs text-slate-500">需求总数</div>
              <div className="text-xl font-bold text-blue-600">{requirements.length}</div>
            </div>
          </div>
        </div>
      </div>

      <button onClick={() => navigate('/reports')} className="mt-6 flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 mx-auto">
        前往 AI 周报 / 月报 / 年报生成 <ArrowUpRight size={14} />
      </button>
    </div>
  )
}
