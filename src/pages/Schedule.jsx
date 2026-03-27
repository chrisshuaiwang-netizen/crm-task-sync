import { useState, useMemo } from 'react'
import {
  Plus,
  X,
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  AlertCircle,
  Sparkles,
  Loader2,
  ChevronDown,
  Trash2,
  AlertTriangle,
  PlayCircle,
  TrendingUp,
} from 'lucide-react'
import useStore from '../store/useStore'
import { generateDailyPriority } from '../utils/aiEngine'

const PRIORITY_BADGE = {
  高: 'bg-red-100 text-red-700 border border-red-200',
  中: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
  低: 'bg-green-100 text-green-700 border border-green-200',
}

const PRIORITY_SECTION_COLOR = {
  高: 'border-red-200 bg-red-50',
  中: 'border-yellow-200 bg-yellow-50',
  低: 'border-green-200 bg-green-50',
}

const STATUS_OPTIONS = ['待处理', '进行中', '已完成']

const STATUS_ICON = {
  待处理: Circle,
  进行中: PlayCircle,
  已完成: CheckCircle2,
}

const STATUS_COLOR = {
  待处理: 'text-slate-400',
  进行中: 'text-blue-500',
  已完成: 'text-green-500',
}

function getTodayStr() {
  return new Date().toISOString().split('T')[0]
}

function getWeekRange() {
  const today = new Date()
  const day = today.getDay()
  const diff = today.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(today)
  monday.setDate(diff)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  const toStr = (d) => d.toISOString().split('T')[0]
  return { start: toStr(monday), end: toStr(sunday) }
}

const defaultForm = {
  title: '',
  desc: '',
  date: getTodayStr(),
  hours: 1,
  priority: '中',
  requirementId: '',
  status: '待处理',
}

function Toast({ message, type, onClose }) {
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${
        type === 'success' ? 'bg-green-600 text-white' : 'bg-slate-800 text-white'
      }`}
    >
      <CheckCircle2 size={16} />
      {message}
      <button onClick={onClose} className="ml-1 opacity-70 hover:opacity-100">
        <X size={14} />
      </button>
    </div>
  )
}

export default function Schedule() {
  const { tasks, requirements, customers, addTask, updateTask, deleteTask } = useStore()

  const [activeTab, setActiveTab] = useState('today')
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState(defaultForm)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null)
  const [aiSorting, setAiSorting] = useState(false)
  const [aiReasoning, setAiReasoning] = useState(null)
  const [toast, setToast] = useState(null)
  const [reqUpdatePrompt, setReqUpdatePrompt] = useState(null)

  const todayStr = getTodayStr()
  const { start: weekStart, end: weekEnd } = getWeekRange()

  function showToast(message, type = 'success') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  const todayTasks = useMemo(
    () =>
      tasks
        .filter((t) => t.date === todayStr)
        .sort((a, b) => {
          const pw = { 高: 3, 中: 2, 低: 1 }
          const sw = { 进行中: 3, 待处理: 2, 已完成: 0 }
          return (pw[b.priority] || 1) - (pw[a.priority] || 1) ||
            (sw[b.status] || 0) - (sw[a.status] || 0)
        }),
    [tasks, todayStr]
  )

  const weekTasks = useMemo(
    () => tasks.filter((t) => t.date >= weekStart && t.date <= weekEnd && t.status !== '已完成'),
    [tasks, weekStart, weekEnd]
  )

  const completedTasks = useMemo(
    () =>
      tasks
        .filter((t) => t.status === '已完成')
        .sort((a, b) => new Date(b.date) - new Date(a.date)),
    [tasks]
  )

  function getReqTitle(reqId) {
    const r = requirements.find((r) => r.id === reqId)
    return r ? r.title : null
  }

  function getCustomerName(customerId) {
    const c = customers.find((c) => c.id === customerId)
    return c ? c.name : null
  }

  function openNewModal() {
    setFormData({ ...defaultForm, date: todayStr })
    setShowModal(true)
  }

  function handleSave() {
    if (!formData.title.trim()) return
    const linked = formData.requirementId
      ? requirements.find((r) => r.id === formData.requirementId)
      : null
    addTask({
      title: formData.title,
      desc: formData.desc,
      date: formData.date,
      hours: Number(formData.hours),
      priority: formData.priority,
      status: formData.status,
      requirementId: formData.requirementId || null,
      customerId: linked ? linked.customerId : null,
    })
    setShowModal(false)
    showToast('任务已添加')
  }

  function handleStatusChange(taskId, newStatus) {
    updateTask(taskId, { status: newStatus })

    if (newStatus === '已完成') {
      const task = tasks.find((t) => t.id === taskId)
      if (task && task.requirementId) {
        const relatedTasks = tasks.filter(
          (t) => t.requirementId === task.requirementId && t.id !== taskId
        )
        const allDone = relatedTasks.every((t) => t.status === '已完成')
        if (allDone) {
          const req = requirements.find((r) => r.id === task.requirementId)
          if (req && req.status !== '已上线') {
            setReqUpdatePrompt({
              reqId: task.requirementId,
              reqTitle: req.title,
            })
          }
        }
      }
    }
  }

  function handleAiPriority() {
    setAiSorting(true)
    setAiReasoning(null)
    setTimeout(() => {
      const { reasoning } = generateDailyPriority(todayTasks)
      setAiReasoning(reasoning)
      setAiSorting(false)
    }, 1500)
  }

  const openRequirements = requirements.filter(
    (r) => r.status !== '已拒绝' && r.status !== '已上线'
  )

  const weekByPriority = {
    高: weekTasks.filter((t) => t.priority === '高'),
    中: weekTasks.filter((t) => t.priority === '中'),
    低: weekTasks.filter((t) => t.priority === '低'),
  }

  const todayHours = todayTasks.reduce((s, t) => s + (t.hours || 0), 0)
  const todayDoneCount = todayTasks.filter((t) => t.status === '已完成').length

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 overflow-y-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">工作计划</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              今日 {todayTasks.length} 个任务 · {todayDoneCount} 已完成 · 共 {todayHours}h
            </p>
          </div>
          <button
            onClick={openNewModal}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} />
            新增任务
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-5 bg-white border border-slate-200 rounded-lg p-1 w-fit">
          {[
            { key: 'today', label: '今日任务', count: todayTasks.length },
            { key: 'week', label: '本周重点', count: weekTasks.length },
            { key: 'done', label: '已完成', count: completedTasks.length },
          ].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === key ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {label}
              <span className={`text-xs ${activeTab === key ? 'text-blue-200' : 'text-slate-400'}`}>
                {count}
              </span>
            </button>
          ))}
        </div>

        {/* Tab: Today */}
        {activeTab === 'today' && (
          <div>
            {/* AI Priority Button */}
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={handleAiPriority}
                disabled={aiSorting || todayTasks.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-purple-50 hover:bg-purple-100 disabled:bg-slate-50 text-purple-700 disabled:text-slate-400 border border-purple-200 disabled:border-slate-200 rounded-lg text-sm font-medium transition-colors"
              >
                {aiSorting ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    AI 分析中…
                  </>
                ) : (
                  <>
                    <Sparkles size={15} />
                    AI 优先级建议
                  </>
                )}
              </button>
              {aiReasoning && (
                <button
                  onClick={() => setAiReasoning(null)}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  收起
                </button>
              )}
            </div>

            {/* AI Reasoning */}
            {aiReasoning && (
              <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <Sparkles size={14} className="text-purple-600" />
                  <span className="text-sm font-semibold text-purple-700">AI 今日规划建议</span>
                </div>
                <pre className="text-xs text-purple-800 whitespace-pre-wrap leading-relaxed font-sans">
                  {aiReasoning}
                </pre>
              </div>
            )}

            {todayTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Calendar size={40} className="mb-3 text-slate-200" />
                <p className="text-base">今日暂无任务</p>
                <button
                  onClick={openNewModal}
                  className="mt-3 text-blue-500 text-sm hover:underline"
                >
                  添加今日任务
                </button>
              </div>
            ) : (
              <div className="space-y-2 max-w-3xl">
                {todayTasks.map((task) => {
                  const isOverdue =
                    task.date < todayStr && task.status !== '已完成'
                  const StatusIcon = STATUS_ICON[task.status] || Circle
                  return (
                    <div
                      key={task.id}
                      className={`bg-white rounded-xl border shadow-sm p-4 transition-all ${
                        isOverdue ? 'border-red-300 ring-1 ring-red-100' : 'border-slate-200'
                      } ${task.status === '已完成' ? 'opacity-60' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Status icon */}
                        <button
                          onClick={() => {
                            const next =
                              task.status === '待处理'
                                ? '进行中'
                                : task.status === '进行中'
                                ? '已完成'
                                : '待处理'
                            handleStatusChange(task.id, next)
                          }}
                          className="mt-0.5 flex-shrink-0"
                        >
                          <StatusIcon size={20} className={STATUS_COLOR[task.status]} />
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p
                              className={`text-sm font-medium leading-snug ${
                                task.status === '已完成'
                                  ? 'line-through text-slate-400'
                                  : 'text-slate-800'
                              }`}
                            >
                              {task.title}
                              {isOverdue && (
                                <span className="ml-2 text-xs text-red-500 font-normal">
                                  已逾期
                                </span>
                              )}
                            </p>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_BADGE[task.priority]}`}>
                                {task.priority}
                              </span>
                            </div>
                          </div>

                          {task.desc && (
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-1">
                              {task.desc}
                            </p>
                          )}

                          <div className="flex items-center gap-3 mt-2">
                            {(task.customerId || task.requirementId) && (
                              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                {task.customerId && (
                                  <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">
                                    {getCustomerName(task.customerId)}
                                  </span>
                                )}
                                {task.requirementId && (
                                  <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded max-w-[120px] truncate">
                                    {getReqTitle(task.requirementId)}
                                  </span>
                                )}
                              </div>
                            )}
                            <span className="text-xs text-slate-400 flex items-center gap-1 ml-auto">
                              <Clock size={11} />
                              {task.hours}h
                            </span>
                            {/* Status dropdown */}
                            <div className="relative">
                              <select
                                value={task.status}
                                onChange={(e) => handleStatusChange(task.id, e.target.value)}
                                className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 cursor-pointer"
                              >
                                {STATUS_OPTIONS.map((s) => (
                                  <option key={s} value={s}>{s}</option>
                                ))}
                              </select>
                            </div>
                            <button
                              onClick={() => setShowDeleteConfirm(task.id)}
                              className="p-1 hover:bg-red-50 rounded text-slate-300 hover:text-red-400 transition-colors"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab: Week */}
        {activeTab === 'week' && (
          <div className="space-y-5 max-w-3xl">
            {weekTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <TrendingUp size={40} className="mb-3 text-slate-200" />
                <p className="text-base">本周暂无进行中的任务</p>
              </div>
            ) : (
              ['高', '中', '低'].map((priority) => {
                const pts = weekByPriority[priority]
                if (pts.length === 0) return null
                return (
                  <div key={priority}>
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border mb-2 ${PRIORITY_SECTION_COLOR[priority]}`}>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PRIORITY_BADGE[priority]}`}>
                        {priority}优先级
                      </span>
                      <span className="text-xs text-slate-500">{pts.length} 个任务</span>
                    </div>
                    <div className="space-y-2 pl-2">
                      {pts.map((task) => (
                        <div
                          key={task.id}
                          className="bg-white rounded-xl border border-slate-200 shadow-sm p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-slate-800 leading-snug">
                                {task.title}
                              </p>
                              {task.desc && (
                                <p className="text-xs text-slate-500 mt-1 line-clamp-1">{task.desc}</p>
                              )}
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-xs text-slate-400 flex items-center gap-1">
                                  <Calendar size={11} />
                                  {task.date}
                                </span>
                                <span className="text-xs text-slate-400 flex items-center gap-1">
                                  <Clock size={11} />
                                  {task.hours}h
                                </span>
                                {task.customerId && (
                                  <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                                    {getCustomerName(task.customerId)}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <select
                                value={task.status}
                                onChange={(e) => handleStatusChange(task.id, e.target.value)}
                                className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
                              >
                                {STATUS_OPTIONS.map((s) => (
                                  <option key={s} value={s}>{s}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* Tab: Completed */}
        {activeTab === 'done' && (
          <div className="max-w-3xl">
            {completedTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <CheckCircle2 size={40} className="mb-3 text-slate-200" />
                <p className="text-base">暂无已完成任务</p>
              </div>
            ) : (
              <div className="space-y-2">
                {completedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 opacity-75"
                  >
                    <div className="flex items-start gap-3">
                      <CheckCircle2 size={18} className="text-green-500 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-600 line-through leading-snug">
                          {task.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <Calendar size={11} />
                            {task.date}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={11} />
                            {task.hours}h
                          </span>
                          {task.customerId && (
                            <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">
                              {getCustomerName(task.customerId)}
                            </span>
                          )}
                          <span className={`px-1.5 py-0.5 rounded ${PRIORITY_BADGE[task.priority]}`}>
                            {task.priority}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowDeleteConfirm(task.id)}
                        className="p-1 hover:bg-red-50 rounded text-slate-300 hover:text-red-400 transition-colors flex-shrink-0"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* New Task Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 flex-shrink-0">
              <h3 className="text-lg font-semibold text-slate-800">新增任务</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  任务标题 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="简短描述任务"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">任务描述</label>
                <textarea
                  value={formData.desc}
                  onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
                  placeholder="详细说明任务内容和目标…"
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">日期</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    预计时长 (h)
                  </label>
                  <input
                    type="number"
                    min="0.5"
                    max="8"
                    step="0.5"
                    value={formData.hours}
                    onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">优先级</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="高">高</option>
                    <option value="中">中</option>
                    <option value="低">低</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">初始状态</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  关联需求
                  <span className="text-xs text-slate-400 ml-1 font-normal">（可选）</span>
                </label>
                <select
                  value={formData.requirementId}
                  onChange={(e) => setFormData({ ...formData, requirementId: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">不关联需求</option>
                  {openRequirements.map((r) => {
                    const customer = customers.find((c) => c.id === r.customerId)
                    return (
                      <option key={r.id} value={r.id}>
                        {customer ? `[${customer.name}] ` : ''}{r.title}
                      </option>
                    )
                  })}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 flex-shrink-0">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={!formData.title.trim()}
                className="px-5 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-lg font-medium transition-colors"
              >
                创建任务
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={20} className="text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">确认删除任务</h3>
                <p className="text-sm text-slate-500 mt-0.5">此操作不可恢复</p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => {
                  deleteTask(showDeleteConfirm)
                  setShowDeleteConfirm(null)
                  showToast('任务已删除')
                }}
                className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Requirement update prompt */}
      {reqUpdatePrompt && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle2 size={20} className="text-green-600" />
              </div>
              <h3 className="font-semibold text-slate-800">关联任务全部完成</h3>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              需求「<span className="font-medium text-slate-800">{reqUpdatePrompt.reqTitle}</span>」的所有关联任务均已完成。是否将需求状态更新为「已上线」？
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setReqUpdatePrompt(null)}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                暂不更新
              </button>
              <button
                onClick={() => {
                  const { updateRequirement } = useStore.getState()
                  updateRequirement(reqUpdatePrompt.reqId, { status: '已上线' })
                  setReqUpdatePrompt(null)
                  showToast('需求状态已更新为已上线')
                }}
                className="px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
              >
                更新为已上线
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}
