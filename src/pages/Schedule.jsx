import { useState, useMemo } from 'react'
import {
  Plus,
  X,
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Trash2,
  AlertTriangle,
  PlayCircle,
  Pencil,
  FileText,
  MessageSquare,
  Users,
  BookOpen,
  StickyNote,
} from 'lucide-react'
import useStore from '../store/useStore'

// ── Constants ──────────────────────────────────────────────────────────────

const PRIORITY_BADGE = {
  高: 'bg-red-100 text-red-700 border border-red-200',
  中: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
  低: 'bg-green-100 text-green-700 border border-green-200',
}

const TASK_STATUS_OPTIONS = ['待处理', '进行中', '已完成']

const TASK_STATUS_ICON = { 待处理: Circle, 进行中: PlayCircle, 已完成: CheckCircle2 }
const TASK_STATUS_COLOR = { 待处理: 'text-slate-400', 进行中: 'text-blue-500', 已完成: 'text-green-500' }
const TASK_STATUS_BADGE = {
  待处理: 'bg-slate-100 text-slate-600',
  进行中: 'bg-blue-100 text-blue-700',
  已完成: 'bg-green-100 text-green-700',
}

const NOTE_CATEGORY_COLORS = {
  会议: 'bg-blue-100 text-blue-700',
  沟通: 'bg-purple-100 text-purple-700',
  其他: 'bg-slate-100 text-slate-600',
}
const NOTE_CATEGORIES = ['会议', '沟通', '其他']

// ── Helpers ────────────────────────────────────────────────────────────────

function getTodayStr() { return new Date().toISOString().split('T')[0] }

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

function getMonthRange() {
  const now = new Date()
  const start = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const end = last.toISOString().split('T')[0]
  return { start, end }
}

const defaultTaskForm = {
  title: '', desc: '', date: getTodayStr(), endDate: '',
  hours: 1, priority: '中', status: '待处理',
  requirementId: '', progress: '', taskType: 'pm',
}

const defaultNoteForm = { title: '', content: '', date: getTodayStr(), category: '会议' }

// ── Toast ──────────────────────────────────────────────────────────────────

function Toast({ message, onClose }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium bg-green-600 text-white">
      <CheckCircle2 size={16} />
      {message}
      <button onClick={onClose} className="ml-1 opacity-70 hover:opacity-100"><X size={14} /></button>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function Schedule() {
  const {
    tasks, requirements, customers, dailyNotes,
    addTask, updateTask, deleteTask,
    addDailyNote, updateDailyNote, deleteDailyNote,
  } = useStore()

  const [activeTab, setActiveTab] = useState('pm')

  // Task modal
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [taskForm, setTaskForm] = useState(defaultTaskForm)

  // Note modal
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [editingNote, setEditingNote] = useState(null)
  const [noteForm, setNoteForm] = useState(defaultNoteForm)

  // Inline progress edit
  const [editingProgress, setEditingProgress] = useState(null) // taskId
  const [progressDraft, setProgressDraft] = useState('')

  // Expand
  const [expandedIds, setExpandedIds] = useState(new Set())
  function toggleExpand(id) {
    setExpandedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  // Delete confirms
  const [deleteTaskId, setDeleteTaskId] = useState(null)
  const [deleteNoteId, setDeleteNoteId] = useState(null)

  // Notes time filter
  const [noteTimeFilter, setNoteTimeFilter] = useState('全部')

  const [toast, setToast] = useState(null)
  function showToast(msg) { setToast(msg); setTimeout(() => setToast(null), 3000) }

  const todayStr = getTodayStr()

  // ── Derived data ──────────────────────────────────────────────────────────

  const pmTasks = useMemo(
    () => tasks
      .filter(t => !t.taskType || t.taskType === 'pm')
      .sort((a, b) => {
        const ps = { 高: 3, 中: 2, 低: 1 }
        const ss = { 进行中: 3, 待处理: 2, 已完成: 0 }
        return (ps[b.priority] || 1) - (ps[a.priority] || 1) ||
          (ss[b.status] || 0) - (ss[a.status] || 0)
      }),
    [tasks]
  )

  const devTasks = useMemo(
    () => tasks
      .filter(t => t.taskType === 'dev')
      .sort((a, b) => {
        const ps = { 高: 3, 中: 2, 低: 1 }
        const ss = { 进行中: 3, 待处理: 2, 已完成: 0 }
        return (ps[b.priority] || 1) - (ps[a.priority] || 1) ||
          (ss[b.status] || 0) - (ss[a.status] || 0)
      }),
    [tasks]
  )

  const filteredNotes = useMemo(() => {
    let notes = [...dailyNotes]
    if (noteTimeFilter === '今天') {
      notes = notes.filter(n => n.date === todayStr)
    } else if (noteTimeFilter === '本周') {
      const { start, end } = getWeekRange()
      notes = notes.filter(n => n.date >= start && n.date <= end)
    } else if (noteTimeFilter === '本月') {
      const { start, end } = getMonthRange()
      notes = notes.filter(n => n.date >= start && n.date <= end)
    }
    return notes.sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0))
  }, [dailyNotes, noteTimeFilter, todayStr])

  // ── Helpers ───────────────────────────────────────────────────────────────

  function getReqTitle(reqId) { return requirements.find(r => r.id === reqId)?.title ?? null }
  function getCustomerName(cid) { return customers.find(c => c.id === cid)?.name ?? null }

  const openReqs = requirements.filter(r => r.status !== '已拒绝' && r.status !== '已上线')

  // ── Task modal handlers ───────────────────────────────────────────────────

  function openNewTaskModal(type) {
    setEditingTask(null)
    setTaskForm({ ...defaultTaskForm, taskType: type, date: todayStr })
    setShowTaskModal(true)
  }

  function openEditTaskModal(task) {
    setEditingTask(task)
    setTaskForm({
      title: task.title, desc: task.desc || '',
      date: task.date || todayStr, endDate: task.endDate || '',
      hours: task.hours || 1, priority: task.priority,
      status: task.status, requirementId: task.requirementId || '',
      progress: task.progress || '', taskType: task.taskType || 'pm',
    })
    setShowTaskModal(true)
  }

  function handleSaveTask() {
    if (!taskForm.title.trim()) return
    const linked = taskForm.requirementId ? requirements.find(r => r.id === taskForm.requirementId) : null
    const payload = {
      title: taskForm.title, desc: taskForm.desc,
      date: taskForm.date, endDate: taskForm.endDate,
      hours: Number(taskForm.hours), priority: taskForm.priority,
      status: taskForm.status, progress: taskForm.progress,
      requirementId: taskForm.requirementId || null,
      customerId: linked ? linked.customerId : null,
      taskType: taskForm.taskType,
    }
    if (editingTask) { updateTask(editingTask.id, payload); showToast('任务已更新') }
    else { addTask(payload); showToast('任务已添加') }
    setShowTaskModal(false); setEditingTask(null)
  }

  function handleStatusCycle(task) {
    const next = task.status === '待处理' ? '进行中' : task.status === '进行中' ? '已完成' : '待处理'
    updateTask(task.id, { status: next })
  }

  // ── Note modal handlers ───────────────────────────────────────────────────

  function openNewNoteModal() {
    setEditingNote(null)
    setNoteForm({ ...defaultNoteForm, date: todayStr })
    setShowNoteModal(true)
  }

  function openEditNoteModal(note) {
    setEditingNote(note)
    setNoteForm({ title: note.title, content: note.content, date: note.date, category: note.category })
    setShowNoteModal(true)
  }

  function handleSaveNote() {
    if (!noteForm.title.trim()) return
    if (editingNote) { updateDailyNote(editingNote.id, noteForm); showToast('事项已更新') }
    else { addDailyNote(noteForm); showToast('事项已记录') }
    setShowNoteModal(false); setEditingNote(null)
  }

  // ── Inline progress save ──────────────────────────────────────────────────

  function saveProgress(taskId) {
    updateTask(taskId, { progress: progressDraft })
    setEditingProgress(null)
  }

  // ── Task Card ─────────────────────────────────────────────────────────────

  function TaskCard({ task }) {
    const isExpanded = expandedIds.has(task.id)
    const StatusIcon = TASK_STATUS_ICON[task.status] || Circle
    const isEditingProg = editingProgress === task.id

    return (
      <div className={`bg-white rounded-xl border shadow-sm transition-all ${task.status === '已完成' ? 'opacity-60 border-slate-100' : 'border-slate-200'}`}>
        {/* Header row */}
        <div className="flex items-start gap-3 p-4">
          <button onClick={() => handleStatusCycle(task)} className="mt-0.5 flex-shrink-0">
            <StatusIcon size={20} className={TASK_STATUS_COLOR[task.status]} />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p className={`text-sm font-medium leading-snug ${task.status === '已完成' ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                {task.title}
              </p>
              <div className="flex items-center gap-1 flex-shrink-0">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_BADGE[task.priority]}`}>{task.priority}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TASK_STATUS_BADGE[task.status]}`}>{task.status}</span>
                <button onClick={() => toggleExpand(task.id)} className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600">
                  {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
                <button onClick={() => openEditTaskModal(task)} className="p-1 hover:bg-blue-50 rounded text-slate-300 hover:text-blue-500">
                  <Pencil size={13} />
                </button>
                <button onClick={() => setDeleteTaskId(task.id)} className="p-1 hover:bg-red-50 rounded text-slate-300 hover:text-red-400">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
            {/* Date summary */}
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              {(task.date || task.endDate) && (
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Calendar size={11} />
                  {task.date}{task.endDate ? ` → ${task.endDate}` : ''}
                </span>
              )}
              {task.hours > 0 && (
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Clock size={11} />{task.hours}h
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Expanded detail */}
        {isExpanded && (
          <div className="border-t border-slate-100 px-4 py-3 space-y-3 bg-slate-50 rounded-b-xl">
            {task.desc && <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{task.desc}</p>}
            {(task.customerId || task.requirementId) && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {task.customerId && (
                  <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded">{getCustomerName(task.customerId)}</span>
                )}
                {task.requirementId && (
                  <span className="bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded max-w-[220px] truncate">{getReqTitle(task.requirementId)}</span>
                )}
              </div>
            )}
            {/* Progress (dev tasks) */}
            {task.taskType === 'dev' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-slate-500">开发进度备注</span>
                  {!isEditingProg && (
                    <button onClick={() => { setEditingProgress(task.id); setProgressDraft(task.progress || '') }} className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-0.5">
                      <Pencil size={11} />编辑
                    </button>
                  )}
                </div>
                {isEditingProg ? (
                  <div>
                    <textarea
                      value={progressDraft}
                      onChange={e => setProgressDraft(e.target.value)}
                      rows={3}
                      placeholder="记录开发进度，如：后端接口已完成，前端联调中…"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      autoFocus
                    />
                    <div className="flex gap-2 mt-1.5">
                      <button onClick={() => saveProgress(task.id)} className="text-xs bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700">保存</button>
                      <button onClick={() => setEditingProgress(null)} className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1">取消</button>
                    </div>
                  </div>
                ) : (
                  <p className={`text-xs leading-relaxed ${task.progress ? 'text-slate-700' : 'text-slate-300 italic'}`}>
                    {task.progress || '暂无进度记录，点击编辑填写'}
                  </p>
                )}
              </div>
            )}
            {/* Status selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">状态：</span>
              <select
                value={task.status}
                onChange={e => updateTask(task.id, { status: e.target.value })}
                className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
              >
                {TASK_STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── Note Card ─────────────────────────────────────────────────────────────

  function NoteCard({ note }) {
    const isExpanded = expandedIds.has(note.id)
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-start gap-3 p-4">
          <div className="flex-shrink-0 mt-0.5">
            {note.category === '会议' ? <Users size={16} className="text-blue-400" /> :
             note.category === '沟通' ? <MessageSquare size={16} className="text-purple-400" /> :
             <StickyNote size={16} className="text-slate-400" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-slate-800 leading-snug">{note.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${NOTE_CATEGORY_COLORS[note.category]}`}>{note.category}</span>
                  <span className="text-xs text-slate-400 flex items-center gap-1"><Calendar size={11} />{note.date}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => toggleExpand(note.id)} className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600">
                  {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
                <button onClick={() => openEditNoteModal(note)} className="p-1 hover:bg-blue-50 rounded text-slate-300 hover:text-blue-500">
                  <Pencil size={13} />
                </button>
                <button onClick={() => setDeleteNoteId(note.id)} className="p-1 hover:bg-red-50 rounded text-slate-300 hover:text-red-400">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          </div>
        </div>
        {isExpanded && note.content && (
          <div className="border-t border-slate-100 px-4 py-3 bg-slate-50 rounded-b-xl">
            <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{note.content}</p>
          </div>
        )}
      </div>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const tabs = [
    { key: 'pm', label: '产品方案', icon: BookOpen, count: pmTasks.length },
    { key: 'dev', label: '开发计划', icon: Sparkles, count: devTasks.length },
    { key: 'notes', label: '日常事项', icon: FileText, count: dailyNotes.length },
  ]

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 overflow-y-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">工作计划</h1>
            <p className="text-slate-500 text-sm mt-0.5">产品方案 {pmTasks.length} · 开发计划 {devTasks.length} · 日常事项 {dailyNotes.length}</p>
          </div>
          {activeTab === 'pm' && (
            <button onClick={() => openNewTaskModal('pm')} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              <Plus size={16} />新增方案
            </button>
          )}
          {activeTab === 'dev' && (
            <button onClick={() => openNewTaskModal('dev')} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              <Plus size={16} />新增计划
            </button>
          )}
          {activeTab === 'notes' && (
            <button onClick={openNewNoteModal} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              <Plus size={16} />记录事项
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-5 bg-white border border-slate-200 rounded-lg p-1 w-fit">
          {tabs.map(({ key, label, icon: Icon, count }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === key ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <Icon size={14} />
              {label}
              <span className={`text-xs ${activeTab === key ? 'text-blue-200' : 'text-slate-400'}`}>{count}</span>
            </button>
          ))}
        </div>

        {/* ── Tab: 产品方案 ─────────────────────────────────────────────── */}
        {activeTab === 'pm' && (
          <div className="max-w-3xl">
            {pmTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <BookOpen size={40} className="mb-3 text-slate-200" />
                <p className="text-base">暂无产品方案任务</p>
                <button onClick={() => openNewTaskModal('pm')} className="mt-3 text-blue-500 text-sm hover:underline">新增第一个方案</button>
              </div>
            ) : (
              <div className="space-y-2">
                {pmTasks.map(task => <TaskCard key={task.id} task={task} />)}
              </div>
            )}
          </div>
        )}

        {/* ── Tab: 开发计划 ─────────────────────────────────────────────── */}
        {activeTab === 'dev' && (
          <div className="max-w-3xl">
            {devTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Sparkles size={40} className="mb-3 text-slate-200" />
                <p className="text-base">暂无开发计划</p>
                <button onClick={() => openNewTaskModal('dev')} className="mt-3 text-blue-500 text-sm hover:underline">新增第一个计划</button>
              </div>
            ) : (
              <div className="space-y-2">
                {devTasks.map(task => <TaskCard key={task.id} task={task} />)}
              </div>
            )}
          </div>
        )}

        {/* ── Tab: 日常事项 ─────────────────────────────────────────────── */}
        {activeTab === 'notes' && (
          <div className="max-w-3xl">
            {/* Time filter */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs text-slate-500 font-medium">时间筛选：</span>
              <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1">
                {['全部', '今天', '本周', '本月'].map(f => (
                  <button
                    key={f}
                    onClick={() => setNoteTimeFilter(f)}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${noteTimeFilter === f ? 'bg-purple-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <span className="text-xs text-slate-400">{filteredNotes.length} 条</span>
            </div>

            {filteredNotes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <FileText size={40} className="mb-3 text-slate-200" />
                <p className="text-base">暂无日常事项</p>
                <button onClick={openNewNoteModal} className="mt-3 text-purple-500 text-sm hover:underline">记录第一条事项</button>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredNotes.map(note => <NoteCard key={note.id} note={note} />)}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Task Modal (新增/编辑) ─────────────────────────────────────────── */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 flex-shrink-0">
              <h3 className="text-lg font-semibold text-slate-800">
                {editingTask ? '编辑任务' : taskForm.taskType === 'pm' ? '新增产品方案' : '新增开发计划'}
              </h3>
              <button onClick={() => { setShowTaskModal(false); setEditingTask(null) }} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">标题 <span className="text-red-500">*</span></label>
                <input
                  type="text" value={taskForm.title}
                  onChange={e => setTaskForm({ ...taskForm, title: e.target.value })}
                  placeholder="简短描述任务"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">描述</label>
                <textarea
                  value={taskForm.desc}
                  onChange={e => setTaskForm({ ...taskForm, desc: e.target.value })}
                  placeholder="详细说明任务内容和目标…"
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">开始日期</label>
                  <input type="date" value={taskForm.date}
                    onChange={e => setTaskForm({ ...taskForm, date: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">结束日期</label>
                  <input type="date" value={taskForm.endDate}
                    onChange={e => setTaskForm({ ...taskForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">优先级</label>
                  <select value={taskForm.priority} onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="高">高</option><option value="中">中</option><option value="低">低</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">状态</label>
                  <select value={taskForm.status} onChange={e => setTaskForm({ ...taskForm, status: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    {TASK_STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">预计时长 (h)</label>
                <input type="number" min="0.5" max="99" step="0.5" value={taskForm.hours}
                  onChange={e => setTaskForm({ ...taskForm, hours: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {/* Progress field for dev tasks */}
              {taskForm.taskType === 'dev' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">开发进度备注</label>
                  <textarea
                    value={taskForm.progress}
                    onChange={e => setTaskForm({ ...taskForm, progress: e.target.value })}
                    placeholder="记录开发进度，如：后端接口已完成，前端联调中…"
                    rows={2}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  关联需求 <span className="text-xs text-slate-400 font-normal">（可选）</span>
                </label>
                <select value={taskForm.requirementId} onChange={e => setTaskForm({ ...taskForm, requirementId: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">不关联需求</option>
                  {openReqs.map(r => {
                    const c = customers.find(c => c.id === r.customerId)
                    return <option key={r.id} value={r.id}>{c ? `[${c.name}] ` : ''}{r.title}</option>
                  })}
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 flex-shrink-0">
              <button onClick={() => { setShowTaskModal(false); setEditingTask(null) }} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">取消</button>
              <button onClick={handleSaveTask} disabled={!taskForm.title.trim()}
                className="px-5 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-lg font-medium transition-colors"
              >
                {editingTask ? '保存修改' : '创建'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Note Modal ──────────────────────────────────────────────────────── */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 flex-shrink-0">
              <h3 className="text-lg font-semibold text-slate-800">{editingNote ? '编辑事项' : '记录日常事项'}</h3>
              <button onClick={() => { setShowNoteModal(false); setEditingNote(null) }} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">标题 <span className="text-red-500">*</span></label>
                <input
                  type="text" value={noteForm.title}
                  onChange={e => setNoteForm({ ...noteForm, title: e.target.value })}
                  placeholder="如：云信科技周例会"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">日期</label>
                  <input type="date" value={noteForm.date}
                    onChange={e => setNoteForm({ ...noteForm, date: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">分类</label>
                  <select value={noteForm.category} onChange={e => setNoteForm({ ...noteForm, category: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    {NOTE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">内容详情</label>
                <textarea
                  value={noteForm.content}
                  onChange={e => setNoteForm({ ...noteForm, content: e.target.value })}
                  placeholder="记录会议要点、沟通结论、待跟进事项…"
                  rows={6}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 flex-shrink-0">
              <button onClick={() => { setShowNoteModal(false); setEditingNote(null) }} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">取消</button>
              <button onClick={handleSaveNote} disabled={!noteForm.title.trim()}
                className="px-5 py-2 text-sm bg-purple-600 hover:bg-purple-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-lg font-medium transition-colors"
              >
                {editingNote ? '保存修改' : '记录'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Task Confirm ───────────────────────────────────────────── */}
      {deleteTaskId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={20} className="text-red-600" />
              </div>
              <div><h3 className="font-semibold text-slate-800">确认删除任务</h3><p className="text-sm text-slate-500 mt-0.5">此操作不可恢复</p></div>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteTaskId(null)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">取消</button>
              <button onClick={() => { deleteTask(deleteTaskId); setDeleteTaskId(null); showToast('任务已删除') }} className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium">确认删除</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Note Confirm ───────────────────────────────────────────── */}
      {deleteNoteId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={20} className="text-red-600" />
              </div>
              <div><h3 className="font-semibold text-slate-800">确认删除事项</h3><p className="text-sm text-slate-500 mt-0.5">此操作不可恢复</p></div>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteNoteId(null)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">取消</button>
              <button onClick={() => { deleteDailyNote(deleteNoteId); setDeleteNoteId(null); showToast('事项已删除') }} className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium">确认删除</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  )
}
