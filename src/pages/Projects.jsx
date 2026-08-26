import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Pencil, Trash2, KanbanSquare, Flag, AlertTriangle, Users, X, CalendarDays } from 'lucide-react'
import useStore from '../store/useStore'
import { filterByVisibility, getPermissions } from '../constants'
import { PROJECT_STATUSES, PROJECT_STATUS_COLORS, PROJECT_RISK } from '../constants'

const emptyForm = { name: '', description: '', customerId: '', status: '规划中', startDate: '', endDate: '', riskLevel: '低', members: [], milestones: [] }

export default function Projects() {
  const store = useStore()
  const { projects, customers, tasks, addProject, updateProject, deleteProject } = store
  const perms = getPermissions(store.workspaces[store.activeWorkspaceId])
  const canEdit = perms.canEdit
  const navigate = useNavigate()

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [selectedId, setSelectedId] = useState(null)

  const visible = useMemo(
    () => filterByVisibility(projects, store.workspaces[store.activeWorkspaceId], (p) => p.ownerId),
    [projects, store.workspaces, store.activeWorkspaceId]
  )

  const selected = projects.find((p) => p.id === selectedId)
  const projectTasks = selected ? tasks.filter((t) => t.projectId === selected.id) : []
  const progress = selected && selected.milestones?.length
    ? Math.round((selected.milestones.filter((m) => m.done).length / selected.milestones.length) * 100)
    : 0

  function openNew() { setForm(emptyForm); setEditingId(null); setShowForm(true) }
  function openEdit(p) { setForm({ ...p, milestones: p.milestones || [] }); setEditingId(p.id); setShowForm(true) }
  function save() {
    if (!form.name.trim()) return
    if (editingId) updateProject(editingId, form)
    else addProject(form)
    setShowForm(false)
  }
  function changeStatus(id, status) { updateProject(id, { status }) }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] md:h-screen">
      <div className="flex-1 min-w-0 flex flex-col border-r border-slate-200 bg-white">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">项目看板</h1>
            <p className="text-slate-500 text-sm mt-0.5">项目进度可视化与团队负载</p>
          </div>
          {canEdit && (
            <button onClick={openNew} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
              <Plus size={16} /> 新建项目
            </button>
          )}
        </div>

        <div className="flex-1 overflow-x-auto p-4">
          <div className="flex gap-4 min-w-max">
            {PROJECT_STATUSES.map((st) => {
              const col = visible.filter((p) => p.status === st)
              return (
                <div key={st} className="w-64 flex-shrink-0">
                  <div className="flex items-center justify-between mb-2 px-1">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${PROJECT_STATUS_COLORS[st]}`}>{st}</span>
                    <span className="text-xs text-slate-400">{col.length}</span>
                  </div>
                  <div className="space-y-2">
                    {col.map((p) => (
                      <button key={p.id} onClick={() => setSelectedId(p.id)} className="w-full text-left bg-white border border-slate-200 rounded-xl p-3 hover:border-blue-300 hover:shadow-sm transition-all">
                        <div className="font-medium text-slate-800 text-sm">{p.name}</div>
                        <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                          <Users size={11} />{customers.find((c) => c.id === p.customerId)?.name || '未关联'}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${PROJECT_RISK[p.riskLevel]}`}>{p.riskLevel}风险</span>
                          {canEdit && (
                            <select value={p.status} onClick={(e) => e.stopPropagation()} onChange={(e) => changeStatus(p.id, e.target.value)} className="ml-auto text-[10px] border border-slate-200 rounded px-1 py-0.5 bg-white">
                              {PROJECT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                          )}
                        </div>
                      </button>
                    ))}
                    {!col.length && <div className="text-xs text-slate-300 text-center py-6 border border-dashed border-slate-200 rounded-xl">暂无</div>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {selected && (
        <div className="hidden lg:flex w-[26rem] flex-col bg-white overflow-y-auto">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="text-lg font-bold text-slate-800 pr-2">{selected.name}</div>
            {canEdit && (
              <div className="flex items-center gap-1">
                <button onClick={() => openEdit(selected)} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600"><Pencil size={14} /></button>
                <button onClick={() => { if (confirm('确认删除？')) { deleteProject(selected.id); setSelectedId(null) } }} className="p-1.5 rounded-md hover:bg-red-50 text-slate-400 hover:text-red-500"><Trash2 size={14} /></button>
              </div>
            )}
          </div>
          <div className="p-5 space-y-4 text-sm">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[11px] px-1.5 py-0.5 rounded ${PROJECT_STATUS_COLORS[selected.status]}`}>{selected.status}</span>
              <span className={`text-[11px] px-1.5 py-0.5 rounded ${PROJECT_RISK[selected.riskLevel]}`}>风险 {selected.riskLevel}</span>
            </div>
            <div className="text-slate-700 text-xs bg-slate-50 rounded-lg p-3">{selected.description}</div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div><div className="text-slate-400 mb-0.5">客户</div><div className="text-slate-700">{customers.find((c) => c.id === selected.customerId)?.name || '—'}</div></div>
              <div><div className="text-slate-400 mb-0.5">周期</div><div className="text-slate-700">{selected.startDate} ~ {selected.endDate}</div></div>
            </div>

            {/* 进度 */}
            <div>
              <div className="text-xs font-semibold text-slate-500 mb-1.5 flex items-center gap-1"><Flag size={13} />里程碑进度 {progress}%</div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${progress}%` }} />
              </div>
              <div className="mt-2 space-y-1.5">
                {(selected.milestones || []).map((m, i) => (
                  <label key={i} className="flex items-center gap-2 text-xs cursor-pointer">
                    <input type="checkbox" checked={m.done} disabled={!canEdit} onChange={(e) => { const ms = selected.milestones.map((x, j) => j === i ? { ...x, done: e.target.checked } : x); updateProject(selected.id, { milestones: ms }) }} className="rounded" />
                    <span className={m.done ? 'text-slate-400 line-through' : 'text-slate-700'}>{m.name}</span>
                    <span className="text-slate-300 ml-auto">{m.date}</span>
                  </label>
                ))}
                {!(selected.milestones || []).length && <div className="text-xs text-slate-300">暂无里程碑</div>}
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold text-slate-500 mb-1.5 flex items-center gap-1"><KanbanSquare size={13} />项目任务（{projectTasks.length}）</div>
              {projectTasks.map((t) => (
                <button key={t.id} onClick={() => navigate('/tasks')} className="w-full text-left text-xs text-slate-600 py-1.5 border-b border-slate-50 hover:text-blue-600 flex justify-between">
                  <span className="truncate">{t.title}</span><span className="text-slate-400 ml-2">{t.status}</span>
                </button>
              ))}
              {!projectTasks.length && <div className="text-xs text-slate-300">暂无关联任务</div>}
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">{editingId ? '编辑项目' : '新建项目'}</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-500">项目名称 *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-xs text-slate-500">项目描述</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
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
                  <label className="text-xs text-slate-500">风险等级</label>
                  <select value={form.riskLevel} onChange={(e) => setForm({ ...form, riskLevel: e.target.value })} className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white">
                    {['低', '中', '高'].map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500">开始日期</label>
                  <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-xs text-slate-500">结束日期</label>
                  <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
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
