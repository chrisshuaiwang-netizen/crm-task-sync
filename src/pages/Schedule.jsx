import { useState, useMemo } from 'react'
import {
  X,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Pencil,
  Layers,
  User,
  Tag,
  Inbox,
  Loader2,
} from 'lucide-react'
import useStore from '../store/useStore'
import { PRIORITY_BADGE, PRIORITY_WEIGHT, STATUS_CONFIG, TAG_COLORS, getPermissions, filterByVisibility } from '../constants'

function Toast({ message, onClose }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium bg-green-600 text-white">
      <CheckCircle2 size={16} />{message}
      <button onClick={onClose} className="ml-1 opacity-70 hover:opacity-100"><X size={14} /></button>
    </div>
  )
}

export default function Schedule() {
  const allTasks = useStore((s) => s.tasks)
  const customers = useStore((s) => s.customers)
  const updateTask = useStore((s) => s.updateTask)
  const workspace = useStore((s) => s.workspaces[s.activeWorkspaceId])

  const perms = getPermissions(workspace)
  const tasks = filterByVisibility(allTasks, workspace, (t) => t.ownerId)

  const [activeTab, setActiveTab] = useState('pending')
  const [expandedIds, setExpandedIds] = useState(new Set())
  const [editingNoteId, setEditingNoteId] = useState(null)
  const [noteDraft, setNoteDraft] = useState('')
  const [toast, setToast] = useState(null)

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(null), 2500) }

  function toggleExpand(id) {
    setExpandedIds((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  function getCustomerName(cid) { return customers.find((c) => c.id === cid)?.name ?? '未关联客户' }

  const sortTasks = (list) =>
    list.sort((a, b) => (PRIORITY_WEIGHT[b.priority] || 1) - (PRIORITY_WEIGHT[a.priority] || 1) ||
      new Date(b.createdAt) - new Date(a.createdAt))

  const pendingTasks = useMemo(() => sortTasks([...tasks.filter((r) => r.status === '待启动')]), [tasks])
  const activeTasks = useMemo(() => sortTasks([...tasks.filter((r) => r.status === '进行中')]), [tasks])

  function startEditNote(task) {
    setEditingNoteId(task.id)
    setNoteDraft(task.progressNote || '')
  }

  function saveNote(taskId) {
    updateTask(taskId, { progressNote: noteDraft })
    setEditingNoteId(null)
    showToast('已保存进度')
  }

  function TaskCard({ task, noteLabel }) {
    const isExpanded = expandedIds.has(task.id)
    const isEditingNote = editingNoteId === task.id

    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-start gap-3 p-4">
          <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${STATUS_CONFIG[task.status]?.dot}`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold text-slate-800 leading-snug">{task.title}</p>
              <div className="flex items-center gap-1 flex-shrink-0">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_BADGE[task.priority]}`}>{task.priority}</span>
                <button onClick={() => toggleExpand(task.id)} className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600">
                  {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
              </div>
            </div>
            <div className="flex items-center flex-wrap gap-2 mt-1.5">
              <span className="text-xs text-slate-500 flex items-center gap-1"><User size={11} />{getCustomerName(task.customerId)}</span>
              {task.deadline && (
                <span className="text-xs text-slate-400 flex items-center gap-1"><Calendar size={11} />截止 {task.deadline}</span>
              )}
              {task.tags?.slice(0, 2).map((tag) => (
                <span key={tag} className={`text-xs px-1.5 py-0.5 rounded font-medium ${TAG_COLORS[tag] || 'bg-slate-100 text-slate-500'}`}>{tag}</span>
              ))}
            </div>
          </div>
        </div>

        {isExpanded && (
          <div className="border-t border-slate-100 bg-slate-50 rounded-b-xl px-4 py-3 space-y-3">
            {task.content && <p className="text-xs text-slate-600 leading-relaxed">{task.content}</p>}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-500">{noteLabel}</span>
                {!isEditingNote && perms.canEdit && (
                  <button onClick={() => startEditNote(task)} className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-0.5">
                    <Pencil size={11} />编辑
                  </button>
                )}
              </div>
              {isEditingNote ? (
                <div>
                  <textarea
                    value={noteDraft}
                    onChange={(e) => setNoteDraft(e.target.value)}
                    rows={3}
                    autoFocus
                    placeholder={`记录${noteLabel}…`}
                    className="w-full px-3 py-2 text-xs border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-white"
                  />
                  <div className="flex gap-2 mt-1.5">
                    <button onClick={() => saveNote(task.id)} className="text-xs bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700">保存</button>
                    <button onClick={() => setEditingNoteId(null)} className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1">取消</button>
                  </div>
                </div>
              ) : (
                <p className={`text-xs leading-relaxed ${task.progressNote ? 'text-slate-700' : 'text-slate-300 italic'}`}>
                  {task.progressNote || `暂无${noteLabel}，点击编辑填写`}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  const tabs = [
    { key: 'pending', label: '待启动', icon: Inbox, count: pendingTasks.length, hint: '来自任务管理中「待启动」的任务' },
    { key: 'active', label: '进行中', icon: Loader2, count: activeTasks.length, hint: '来自任务管理中「进行中」的任务' },
  ]
  const currentHint = tabs.find((t) => t.key === activeTab)?.hint

  return (
    <div className="flex flex-col min-h-screen md:h-screen">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">工作计划</h1>
          <p className="text-slate-500 text-sm mt-0.5">待启动 {pendingTasks.length} 条 · 进行中 {activeTasks.length} 条</p>
        </div>

        <div className="flex items-center gap-1 mb-2 bg-white border border-slate-200 rounded-lg p-1 w-fit">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === t.key ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <t.icon size={14} />{t.label}
              <span className={`text-xs ${activeTab === t.key ? 'text-blue-200' : 'text-slate-400'}`}>{t.count}</span>
            </button>
          ))}
        </div>

        <p className="text-xs text-slate-400 mb-5 flex items-center gap-1">
          <Tag size={11} />
          {currentHint}，在任务管理中修改状态后自动同步
        </p>

        {activeTab === 'pending' && (
          <div className="max-w-3xl">
            {pendingTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Inbox size={40} className="mb-3 text-slate-200" />
                <p className="text-base">暂无待启动任务</p>
                <p className="text-xs text-slate-300 mt-1">在任务管理中将任务状态改为「待启动」即可自动出现在这里</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingTasks.map((task) => (<TaskCard key={task.id} task={task} noteLabel="启动准备" />))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'active' && (
          <div className="max-w-3xl">
            {activeTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Loader2 size={40} className="mb-3 text-slate-200" />
                <p className="text-base">暂无进行中的任务</p>
                <p className="text-xs text-slate-300 mt-1">在任务管理中将任务状态改为「进行中」即可自动出现在这里</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeTasks.map((task) => (<TaskCard key={task.id} task={task} noteLabel="进展记录" />))}
              </div>
            )}
          </div>
        )}
      </div>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  )
}
