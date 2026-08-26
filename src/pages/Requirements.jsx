import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, Pencil, Trash2, Search, ClipboardList, Sparkles, Check, X, Layers, Paperclip, Download, MessageSquareText, FileText,
} from 'lucide-react'
import useStore from '../store/useStore'
import { filterByVisibility, getPermissions } from '../constants'
import {
  REQUIREMENT_STATUSES, REQUIREMENT_STATUS_COLORS, REQUIREMENT_ORDER,
  REQUIREMENT_TAGS, REQUIREMENT_TAG_COLORS, PRIORITY_BADGE,
  DIFFICULTY_COLORS, FEASIBILITY_COLORS,
} from '../constants'
import { putFile, downloadFile, deleteFile } from '../utils/fileStore'
import RequirementAnalyzer from '../components/RequirementAnalyzer'

const emptyForm = { title: '', content: '', customerId: '', priority: '中', status: '待评审', tags: [], source: '会议记录', expectedWorkload: '', deadline: '' }

// 标准拆解阶段（PRD：产品设计/前端/后端/测试/上线）
const PHASES = ['产品设计', '前端开发', '后端开发', '测试', '上线']

export default function Requirements() {
  const store = useStore()
  const { requirements, customers, tasks, files, addRequirement, updateRequirement, deleteRequirement, decomposeRequirement, addFileMeta, removeFileMeta } = store
  const perms = getPermissions(store.workspaces[store.activeWorkspaceId])
  const canEdit = perms.canEdit
  const navigate = useNavigate()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('全部')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [decomposeFor, setDecomposeFor] = useState(null) // req id
  const [suggested, setSuggested] = useState([])
  const [analyzerFor, setAnalyzerFor] = useState(null) // requirement object

  const visible = useMemo(
    () => filterByVisibility(requirements, store.workspaces[store.activeWorkspaceId], (r) => r.ownerId),
    [requirements, store.workspaces, store.activeWorkspaceId]
  )
  const list = visible
    .filter((r) => (statusFilter === '全部' || r.status === statusFilter) && r.title.includes(search.trim()))
    .sort((a, b) => REQUIREMENT_ORDER[a.status] - REQUIREMENT_ORDER[b.status])

  const selected = requirements.find((r) => r.id === selectedId)
  const relatedTasks = selected ? tasks.filter((t) => t.requirementId === selected.id) : []

  function openNew() { setForm(emptyForm); setEditingId(null); setShowForm(true) }
  function openEdit(r) { setForm({ ...r }); setEditingId(r.id); setShowForm(true) }
  function save() {
    if (!form.title.trim()) return
    if (editingId) updateRequirement(editingId, form)
    else addRequirement(form)
    setShowForm(false)
  }

  function startDecompose(r) {
    const base = r.title
    setSuggested(PHASES.map((p, i) => ({
      title: `${base} - ${p}`,
      content: `需求「${base}」的${p}阶段工作`,
      priority: r.priority,
      status: i === 0 ? '进行中' : '待启动',
      source: '产品规划',
      deadline: '',
      scheduledDate: '',
      tags: [],
    })))
    setDecomposeFor(r.id)
  }
  function confirmDecompose() {
    decomposeRequirement(decomposeFor, suggested)
    setDecomposeFor(null)
    setSuggested([])
  }

  async function handleUpload(e) {
    if (!selected) return
    const picked = Array.from(e.target.files || [])
    for (const f of picked) {
      const id = await putFile(f)
      addFileMeta({ id, name: f.name, size: f.size, type: f.type || 'file', source: 'requirement', refId: selected.id })
      updateRequirement(selected.id, { fileIds: [...(selected.fileIds || []), id] })
    }
    e.target.value = ''
  }
  async function handleRemoveFile(id) {
    await deleteFile(id)
    removeFileMeta(id)
    if (selected) updateRequirement(selected.id, { fileIds: (selected.fileIds || []).filter((x) => x !== id) })
  }
  const fileMetaOf = (id) => files.find((f) => f.id === id)

  return (
    <div className="flex h-[calc(100vh-3.5rem)] md:h-screen">
      <div className="flex-1 min-w-0 flex flex-col border-r border-slate-200 bg-white">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">需求池</h1>
            <p className="text-slate-500 text-sm mt-0.5">需求独立于任务，确认后可拆解为任务</p>
          </div>
          {canEdit && (
            <button onClick={openNew} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
              <Plus size={16} /> 录入需求
            </button>
          )}
        </div>

        <div className="px-5 py-3 border-b border-slate-100 flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索需求" className="pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          {['全部', ...REQUIREMENT_STATUSES].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`text-xs px-2.5 py-1.5 rounded-lg transition-colors ${statusFilter === s ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{s}</button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {list.map((r) => (
            <button key={r.id} onClick={() => setSelectedId(r.id)} className={`w-full text-left p-3.5 rounded-xl border transition-colors ${selectedId === r.id ? 'border-blue-300 bg-blue-50' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}>
              <div className="flex items-center gap-2 mb-1.5">
                <ClipboardList size={16} className="text-slate-400" />
                <span className="font-medium text-slate-800 truncate">{r.title}</span>
                <span className={`text-[11px] px-1.5 py-0.5 rounded ${REQUIREMENT_STATUS_COLORS[r.status]}`}>{r.status}</span>
                <span className={`ml-auto text-[11px] px-1.5 py-0.5 rounded ${PRIORITY_BADGE[r.priority]}`}>{r.priority}</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-slate-400">{customers.find((c) => c.id === r.customerId)?.name || '未关联客户'}</span>
                {(r.tags || []).map((t) => <span key={t} className={`text-[11px] px-1.5 py-0.5 rounded ${REQUIREMENT_TAG_COLORS[t] || 'bg-slate-100 text-slate-500'}`}>{t}</span>)}
                <span className="text-xs text-slate-400 ml-auto">工时 {r.expectedWorkload || '—'}</span>
              </div>
            </button>
          ))}
          {!list.length && <div className="text-center text-slate-400 text-sm py-10">暂无需求</div>}
        </div>
      </div>

      {selected && (
        <div className="hidden md:flex w-96 flex-col bg-white overflow-y-auto">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="text-lg font-bold text-slate-800 pr-2">{selected.title}</div>
            {canEdit && (
              <div className="flex items-center gap-1">
                <button onClick={() => setAnalyzerFor(selected)} className="p-1.5 rounded-md hover:bg-blue-50 text-blue-500 hover:text-blue-700" title="AI 分析（难度/周期评估 + 生成文档与原型）"><MessageSquareText size={14} /></button>
                <button onClick={() => openEdit(selected)} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600"><Pencil size={14} /></button>
                <button onClick={() => { if (confirm('确认删除该需求？')) deleteRequirement(selected.id) }} className="p-1.5 rounded-md hover:bg-red-50 text-slate-400 hover:text-red-500"><Trash2 size={14} /></button>
              </div>
            )}
            {!canEdit && (
              <button onClick={() => setAnalyzerFor(selected)} className="p-1.5 rounded-md hover:bg-blue-50 text-blue-500" title="AI 分析"><MessageSquareText size={14} /></button>
            )}
          </div>
          <div className="p-5 space-y-4 text-sm">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[11px] px-1.5 py-0.5 rounded ${REQUIREMENT_STATUS_COLORS[selected.status]}`}>{selected.status}</span>
              <span className={`text-[11px] px-1.5 py-0.5 rounded ${PRIORITY_BADGE[selected.priority]}`}>{selected.priority}</span>
              <span className="text-xs text-slate-400">{customers.find((c) => c.id === selected.customerId)?.name || '未关联'}</span>
            </div>
            <div className="text-slate-700 text-xs bg-slate-50 rounded-lg p-3">{selected.content}</div>

            {/* 关联文件 */}
            <div>
              <div className="text-xs font-semibold text-slate-500 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1"><Paperclip size={13} />关联文件（{(selected.fileIds || []).length}）</span>
                {canEdit && (
                  <label className="text-blue-600 hover:underline cursor-pointer flex items-center gap-1">
                    <Paperclip size={12} />上传
                    <input type="file" multiple className="hidden" onChange={handleUpload} />
                  </label>
                )}
              </div>
              <div className="space-y-1.5">
                {(selected.fileIds || []).map((id) => {
                  const f = fileMetaOf(id)
                  if (!f) return null
                  return (
                    <div key={id} className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 rounded-lg px-2.5 py-1.5">
                      <FileText size={13} className="text-slate-400" />
                      <span className="truncate flex-1">{f.name}</span>
                      <button onClick={() => downloadFile(f)} className="text-blue-600 hover:underline">下载</button>
                      {canEdit && <button onClick={() => handleRemoveFile(id)} className="text-slate-400 hover:text-red-500">移除</button>}
                    </div>
                  )
                })}
                {!(selected.fileIds || []).length && <div className="text-xs text-slate-300 py-1">暂无附件，可上传需求文档/截图</div>}
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold text-slate-500 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1"><Layers size={13} />关联任务（{relatedTasks.length}）</span>
                {canEdit && selected.status !== '已上线' && selected.status !== '已拒绝' && (
                  <button onClick={() => startDecompose(selected)} className="text-blue-600 hover:underline flex items-center gap-1">
                    <Sparkles size={12} /> AI 拆解
                  </button>
                )}
              </div>
              {relatedTasks.map((t) => (
                <button key={t.id} onClick={() => navigate('/tasks')} className="w-full text-left text-xs text-slate-600 py-1.5 border-b border-slate-50 hover:text-blue-600 flex justify-between">
                  <span className="truncate">{t.title}</span><span className="text-slate-400 ml-2 flex-shrink-0">{t.status}</span>
                </button>
              ))}
              {!relatedTasks.length && <div className="text-xs text-slate-300 py-1">尚未拆解</div>}
            </div>

            {selected.analysis && (
              <div className="border border-blue-100 bg-blue-50 rounded-xl p-3.5">
                <div className="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1"><Sparkles size={13} className="text-blue-500" />AI 分析结论</div>
                <div className="flex flex-wrap items-center gap-2 text-xs mb-2">
                  <span className={`px-2 py-0.5 rounded ${FEASIBILITY_COLORS[selected.analysis.feasible] || 'bg-slate-100 text-slate-600'}`}>{selected.analysis.feasible}</span>
                  <span className={`px-2 py-0.5 rounded ${DIFFICULTY_COLORS[selected.analysis.difficulty] || 'bg-slate-100 text-slate-600'}`}>难度 {selected.analysis.difficulty}</span>
                  <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">约 {selected.analysis.totalDays} 人天</span>
                </div>
                {selected.prd ? (
                  <button onClick={() => setAnalyzerFor(selected)} className="text-xs text-blue-600 hover:underline flex items-center gap-1"><FileText size={12} />查看需求文档 / 原型</button>
                ) : (
                  <button onClick={() => setAnalyzerFor(selected)} className="text-xs text-blue-600 hover:underline">重新分析 / 继续推进</button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 表单 */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">{editingId ? '编辑需求' : '录入需求'}</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-500">需求标题 *</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-xs text-slate-500">需求描述</label>
                <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={3} className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500">关联客户</label>
                  <select value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })} className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white">
                    <option value="">未关联</option>
                    {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500">状态</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white">
                    {REQUIREMENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500">优先级</label>
                  <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white">
                    {['高', '中', '低'].map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500">预计工时</label>
                  <input value={form.expectedWorkload} onChange={(e) => setForm({ ...form, expectedWorkload: e.target.value })} placeholder="人天" className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {REQUIREMENT_TAGS.map((t) => (
                  <button key={t} type="button" onClick={() => setForm({ ...form, tags: form.tags.includes(t) ? form.tags.filter((x) => x !== t) : [...form.tags, t] })} className={`text-[11px] px-2 py-1 rounded ${form.tags.includes(t) ? REQUIREMENT_TAG_COLORS[t] : 'bg-slate-100 text-slate-500'}`}>{t}</button>
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

      {/* 拆解确认 */}
      {decomposeFor && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => { setDecomposeFor(null); setSuggested([]) }}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={18} className="text-blue-600" />
              <h3 className="text-lg font-bold text-slate-800">AI 拆解建议</h3>
            </div>
            <p className="text-xs text-slate-500 mb-3">以下为标准阶段任务建议，确认后批量创建并关联本需求：</p>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {suggested.map((s, i) => (
                <div key={i} className="border border-slate-200 rounded-lg p-2.5 text-sm">
                  <div className="font-medium text-slate-800">{s.title}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{s.content}</div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={confirmDecompose} className="flex-1 flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-medium"><Check size={15} /> 确认创建 {suggested.length} 个任务</button>
              <button onClick={() => { setDecomposeFor(null); setSuggested([]) }} className="px-4 text-slate-500 hover:bg-slate-100 py-2.5 rounded-lg text-sm">取消</button>
            </div>
          </div>
        </div>
      )}

      {/* 需求分析器 */}
      {analyzerFor && (
        <RequirementAnalyzer requirement={analyzerFor} onClose={() => setAnalyzerFor(null)} />
      )}
    </div>
  )
}
