import { useState, useMemo } from 'react'
import {
  Plus, Pencil, Trash2, Search, BookOpen, FileText, Download, X, Paperclip, Link2,
} from 'lucide-react'
import useStore from '../store/useStore'
import { putFile, downloadFile, deleteFile } from '../utils/fileStore'
import {
  KNOWLEDGE_TYPES, KNOWLEDGE_TYPE_COLORS, FILE_SOURCES, FILE_SOURCE_COLORS,
} from '../constants'

const emptyForm = { title: '', type: '产品规范', content: '', tags: [], fileIds: [] }

function fmtSize(n) {
  if (!n && n !== 0) return '—'
  if (n < 1024) return `${n}B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)}KB`
  return `${(n / 1024 / 1024).toFixed(1)}MB`
}

export default function Knowledge() {
  const store = useStore()
  const { knowledgeBase, files, addKnowledge, updateKnowledge, deleteKnowledge, addFileMeta, removeFileMeta } = store
  const [tab, setTab] = useState('kb')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [selectedId, setSelectedId] = useState(null)

  const list = useMemo(
    () => knowledgeBase.filter((k) => k.title.includes(search.trim()) || (k.tags || []).some((t) => t.includes(search.trim()))),
    [knowledgeBase, search]
  )
  const selected = knowledgeBase.find((k) => k.id === selectedId)

  async function handlePick(e, setIds) {
    const picked = Array.from(e.target.files || [])
    for (const f of picked) {
      const id = await putFile(f)
      addFileMeta({ id, name: f.name, size: f.size, type: f.type || 'file', source: 'knowledge' })
      setIds((ids) => [...ids, id])
    }
    e.target.value = ''
  }

  function openNew() { setForm(emptyForm); setEditingId(null); setShowForm(true) }
  function openEdit(k) { setForm({ ...k }); setEditingId(k.id); setShowForm(true) }
  function save() {
    if (!form.title.trim()) return
    if (editingId) updateKnowledge(editingId, form)
    else addKnowledge(form)
    setShowForm(false)
  }
  async function removeAttached(id) {
    await deleteFile(id)
    removeFileMeta(id)
    setForm((f) => ({ ...f, fileIds: f.fileIds.filter((x) => x !== id) }))
  }

  function fileOf(id) { return files.find((f) => f.id === id) }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] md:h-screen">
      <div className="flex-1 min-w-0 flex flex-col border-r border-slate-200 bg-white">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">文档总结中心 · 知识库</h1>
            <p className="text-slate-500 text-sm mt-0.5">沉淀产品规范 / 业务文档 / 竞品，供需求分析引用</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-slate-100 rounded-lg p-0.5 text-sm">
              <button onClick={() => setTab('kb')} className={`px-3 py-1.5 rounded-md ${tab === 'kb' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>知识库</button>
              <button onClick={() => setTab('files')} className={`px-3 py-1.5 rounded-md ${tab === 'files' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>文件库（{files.length}）</button>
            </div>
            {tab === 'kb' && (
              <button onClick={openNew} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
                <Plus size={16} /> 新建条目
              </button>
            )}
          </div>
        </div>

        <div className="px-5 py-3 border-b border-slate-100">
          <div className="relative max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={tab === 'kb' ? '搜索知识库' : '搜索文件'} className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {tab === 'kb' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {list.map((k) => (
                <button key={k.id} onClick={() => setSelectedId(k.id)} className={`text-left p-4 rounded-xl border transition-colors ${selectedId === k.id ? 'border-blue-300 bg-blue-50' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen size={16} className="text-blue-500" />
                    <span className="font-medium text-slate-800 truncate flex-1">{k.title}</span>
                    <span className={`text-[11px] px-1.5 py-0.5 rounded ${KNOWLEDGE_TYPE_COLORS[k.type]}`}>{k.type}</span>
                  </div>
                  <div className="text-xs text-slate-500 line-clamp-3">{k.content}</div>
                  {k.fileIds?.length > 0 && (
                    <div className="mt-2 flex items-center gap-1 text-[11px] text-slate-400"><Paperclip size={12} />{k.fileIds.length} 个附件</div>
                  )}
                </button>
              ))}
              {!list.length && <div className="text-center text-slate-400 text-sm py-10">暂无知识条目</div>}
            </div>
          ) : (
            <div className="space-y-2">
              {files.map((f) => (
                <div key={f.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-white">
                  <FileText size={18} className="text-slate-400" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-slate-800 truncate">{f.name}</div>
                    <div className="text-xs text-slate-400">{fmtSize(f.size)} · {f.type || 'file'}</div>
                  </div>
                  <span className={`text-[11px] px-1.5 py-0.5 rounded ${FILE_SOURCE_COLORS[f.source] || 'bg-slate-100 text-slate-500'}`}>{FILE_SOURCES[f.source] || '通用'}</span>
                  <button onClick={() => downloadFile(f)} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-blue-600" title="下载"><Download size={15} /></button>
                  <button onClick={async () => { await deleteFile(f.id); removeFileMeta(f.id) }} className="p-1.5 rounded-md hover:bg-red-50 text-slate-400 hover:text-red-500" title="删除"><Trash2 size={15} /></button>
                </div>
              ))}
              {!files.length && <div className="text-center text-slate-400 text-sm py-10">暂无上传文件</div>}
            </div>
          )}
        </div>
      </div>

      {tab === 'kb' && selected && (
        <div className="hidden md:flex w-96 flex-col bg-white overflow-y-auto">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="text-lg font-bold text-slate-800 pr-2 truncate">{selected.title}</div>
            <div className="flex items-center gap-1">
              <button onClick={() => openEdit(selected)} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600"><Pencil size={14} /></button>
              <button onClick={() => { if (confirm('确认删除该知识条目？')) { deleteKnowledge(selected.id); setSelectedId(null) } }} className="p-1.5 rounded-md hover:bg-red-50 text-slate-400 hover:text-red-500"><Trash2 size={14} /></button>
            </div>
          </div>
          <div className="p-5 space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[11px] px-1.5 py-0.5 rounded ${KNOWLEDGE_TYPE_COLORS[selected.type]}`}>{selected.type}</span>
              {(selected.tags || []).map((t) => <span key={t} className="text-[11px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">{t}</span>)}
            </div>
            <pre className="text-xs text-slate-700 bg-slate-50 rounded-lg p-3 whitespace-pre-wrap font-sans">{selected.content}</pre>
            <div>
              <div className="text-xs font-semibold text-slate-500 mb-1.5 flex items-center gap-1"><Paperclip size={13} />附件（{(selected.fileIds || []).length}）</div>
              <div className="space-y-1.5">
                {(selected.fileIds || []).map((id) => {
                  const f = fileOf(id)
                  if (!f) return null
                  return (
                    <div key={id} className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 rounded-lg px-2.5 py-1.5">
                      <FileText size={13} className="text-slate-400" />
                      <span className="truncate flex-1">{f.name}</span>
                      <span className="text-slate-400">{fmtSize(f.size)}</span>
                      <button onClick={() => downloadFile(f)} className="text-blue-600 hover:underline">下载</button>
                    </div>
                  )
                })}
                {!(selected.fileIds || []).length && <div className="text-xs text-slate-300">无附件</div>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 知识库表单 */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">{editingId ? '编辑知识条目' : '新建知识条目'}</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-500">标题 *</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500">类型</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white">
                    {KNOWLEDGE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500">标签（逗号分隔）</label>
                  <input value={(form.tags || []).join(',')} onChange={(e) => setForm({ ...form, tags: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} placeholder="验收, POC" className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-500">内容</label>
                <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={5} className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-xs text-slate-500 flex items-center gap-1"><Link2 size={12} />附件</label>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {(form.fileIds || []).map((id) => {
                    const f = fileOf(id)
                    return (
                      <span key={id} className="text-[11px] px-2 py-1 rounded bg-slate-100 text-slate-600 flex items-center gap-1">
                        {f?.name || id}
                        <button onClick={() => removeAttached(id)} className="text-slate-400 hover:text-red-500"><X size={11} /></button>
                      </span>
                    )
                  })}
                  <label className="text-[11px] px-2 py-1 rounded border border-dashed border-slate-300 text-slate-500 cursor-pointer hover:border-blue-400">
                    上传
                    <input type="file" multiple className="hidden" onChange={(e) => handlePick(e, (ids) => setForm((f) => ({ ...f, fileIds: ids })))} />
                  </label>
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
