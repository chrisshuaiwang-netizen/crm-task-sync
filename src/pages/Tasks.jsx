import { useState, useMemo } from 'react'
import { Plus, Pencil, Trash2, Search, ListChecks, Clock, X, Paperclip } from 'lucide-react'
import useStore from '../store/useStore'
import { filterByVisibility, getPermissions } from '../constants'
import {
  PRIORITY_BADGE, STATUS_CONFIG, STATUS_ORDER, ALL_STATUSES,
  TAG_COLORS, ALL_TAGS, TASK_STATUSES, TASK_SOURCES,
} from '../constants'
import { formatDateShort } from '../utils/format'

const emptyForm = { title: '', content: '', customerId: '', requirementId: '', projectId: '', priority: '中', status: '待启动', source: '其他', deadline: '', scheduledDate: '', tags: [] }

export default function Tasks() {
  const store = useStore()
  const { tasks, customers, requirements, addTask, updateTask, deleteTask } = store
  const perms = getPermissions(store.workspaces[store.activeWorkspaceId])
  const canEdit = perms.canEdit

  const [statusFilter, setStatusFilter] = useState('全部')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [selectedId, setSelectedId] = useState(null)

  const visible = useMemo(
    () => filterByVisibility(tasks, store.workspaces[store.activeWorkspaceId], (t) => t.ownerId),
    [tasks, store.workspaces, store.activeWorkspaceId]
  )
  const filtered = visible
    .filter((t) => (statusFilter === '全部' || t.status === statusFilter))
    .filter((t) => t.title.includes(search.trim()))
    .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status])

  const statusCounts = ALL_STATUSES.reduce((acc, s) => {
    acc[s] = s === '全部' ? visible.length : visible.filter((t) => t.status === s).length
    return acc
  }, {})

  const selected = tasks.find((t) => t.id === selectedId)
  const getCustomerName = (id) => customers.find((c) => c.id === id)?.name || '未关联'

  function openNew() { setForm(emptyForm); setEditingId(null); setShowForm(true) }
  function openEdit(t) { setForm({ ...t, tags: t.tags || [] }); setEditingId(t.id); setShowForm(true) }
  function save() {
    if (!form.title.trim()) return
    if (editingId) updateTask(editingId, form)
    else addTask(form)
    setShowForm(false)
  }
  function handleStatusChange(id, newStatus) {
    updateTask(id, { status: newStatus })
    if (selected && selected.id === id) setSelectedId(null)
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] md:h-screen">
      <div className="flex-1 min-w-0 flex flex-col border-r border-slate-200 bg-white">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">任务总览</h1>
            <p className="text-slate-500 text-sm mt-0.5">共 {visible.length} 条任务（按权限可见）</p>
          </div>
          {canEdit && (
            <button onClick={openNew} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
              <Plus size={16} /> 记录任务
            </button>
          )}
        </div>

        <div className="px-5 py-3 border-b border-slate-100 flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索任务" className="pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          {ALL_STATUSES.map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`text-xs px-2.5 py-1.5 rounded-lg transition-colors ${statusFilter === s ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {s} {statusCounts[s] > 0 && <span className="ml-0.5 opacity-70">{statusCounts[s]}</span>}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filtered.map((t) => (
            <button key={t.id} onClick={() => setSelectedId(t.id)} className={`w-full text-left p-3.5 rounded-xl border transition-colors ${selectedId === t.id ? 'border-blue-300 bg-blue-50' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`w-2 h-2 rounded-full ${STATUS_CONFIG[t.status]?.dot}`} />
                <span className="font-medium text-slate-800 truncate">{t.title}</span>
                <span className={`ml-auto text-[11px] px-1.5 py-0.5 rounded ${PRIORITY_BADGE[t.priority]}`}>{t.priority}</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap text-xs text-slate-400">
                <span>{getCustomerName(t.customerId)}</span>
                {t.requirementId && <span>· 需求</span>}
                {t.projectId && <span>· 项目</span>}
                {(t.tags || []).slice(0, 2).map((tag) => <span key={tag} className={`px-1.5 py-0.5 rounded ${TAG_COLORS[tag] || 'bg-slate-100 text-slate-500'}`}>{tag}</span>)}
                {t.deadline && <span className="ml-auto flex items-center gap-1"><Clock size={11} />{t.deadline}</span>}
              </div>
            </button>
          ))}
          {!filtered.length && <div className="text-center text-slate-400 text-sm py-10">暂无任务</div>}
        </div>
      </div>

      {selected && (
        <div className="hidden md:flex w-96 flex-col bg-white overflow-y-auto">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="text-lg font-bold text-slate-800 pr-2">{selected.title}</div>
            {canEdit && (
              <div className="flex items-center gap-1">
                <button onClick={() => openEdit(selected)} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600"><Pencil size={14} /></button>
                <button onClick={() => { if (confirm('确认删除？')) { deleteTask(selected.id); setSelectedId(null) } }} className="p-1.5 rounded-md hover:bg-red-50 text-slate-400 hover:text-red-500"><Trash2 size={14} /></button>
              </div>
            )}
          </div>
          <div className="p-5 space-y-4 text-sm">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[11px] px-1.5 py-0.5 rounded ${STATUS_CONFIG[selected.status]?.badge}`}>{selected.status}</span>
              <span className={`text-[11px] px-1.5 py-0.5 rounded ${PRIORITY_BADGE[selected.priority]}`}>{selected.priority}</span>
            </div>
            <div className="text-slate-700 text-xs bg-slate-50 rounded-lg p-3">{selected.content}</div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div><div className="text-slate-400 mb-0.5">客户</div><div className="text-slate-700">{getCustomerName(selected.customerId)}</div></div>
              <div><div className="text-slate-400 mb-0.5">来源</div><div className="text-slate-700">{selected.source}</div></div>
              <div><div className="text-slate-400 mb-0.5">截止</div><div className="text-slate-700">{selected.deadline || '未设置'}</div></div>
              <div><div className="text-slate-400 mb-0.5">计划执行</div><div className="text-slate-700">{selected.scheduledDate || '未排期'}</div></div>
            </div>

            <div>
              <div className="text-xs font-semibold text-slate-500 mb-1.5">状态变更</div>
              <div className="flex flex-wrap gap-2">
                {TASK_STATUSES.map((s) => (
                  <button key={s} onClick={() => canEdit && handleStatusChange(selected.id, s)} disabled={!canEdit} className={`text-xs px-3 py-1.5 rounded-lg font-medium border transition-all ${selected.status === s ? `${STATUS_CONFIG[s]?.badge} border-current` : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {selected.statusHistory?.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-slate-500 mb-1.5">变更记录</div>
                <div className="space-y-1.5">
                  {selected.statusHistory.slice().reverse().map((h, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[h.status]?.dot}`} />
                      <span className="text-slate-700">{h.status}</span>
                      <span className="text-slate-300 ml-auto">{formatDateShort(h.at)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">{editingId ? '编辑任务' : '记录任务'}</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-500">任务标题 *</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-xs text-slate-500">任务内容</label>
                <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={3} className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500">客户</label>
                  <select value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })} className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white">
                    <option value="">未关联</option>
                    {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500">关联需求</label>
                  <select value={form.requirementId} onChange={(e) => setForm({ ...form, requirementId: e.target.value })} className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white">
                    <option value="">未关联</option>
                    {requirements.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500">状态</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white">
                    {TASK_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500">优先级</label>
                  <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white">
                    {['高', '中', '低'].map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500">截止日期</label>
                  <input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-xs text-slate-500">计划执行日</label>
                  <input type="date" value={form.scheduledDate} onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })} className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {ALL_TAGS.map((t) => (
                  <button key={t} type="button" onClick={() => setForm({ ...form, tags: form.tags.includes(t) ? form.tags.filter((x) => x !== t) : [...form.tags, t] })} className={`text-[11px] px-2 py-1 rounded ${form.tags.includes(t) ? TAG_COLORS[t] : 'bg-slate-100 text-slate-500'}`}>{t}</button>
                ))}
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={save} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-medium">保存</button>
              <button onClick={() => setShowForm(false)} className="px-4 text-slate-500 hover:bg-slate-100 py-2.5 rounded-lg text-sm">取消</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
