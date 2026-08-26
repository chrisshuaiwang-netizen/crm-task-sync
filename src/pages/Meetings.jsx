import { useState, useEffect, useMemo } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Sparkles,
  Loader2,
  ClipboardList,
  CheckCircle2,
  AlertTriangle,
  CalendarDays,
  Users,
  Building2,
  Bot,
  Send,
} from 'lucide-react'
import useStore from '../store/useStore'
import { MEETING_CATEGORIES, getPermissions, filterByVisibility } from '../constants'
import { callLLM } from '../utils/llm'

const emptyForm = {
  title: '',
  date: new Date().toISOString().slice(0, 10),
  category: '客户会',
  relatedCustomerIds: [],
  relatedProjectIds: [],
  content: '<p></p>',
  todos: [],
}

// 去掉 HTML 标签得到纯文本
function htmlToText(html = '') {
  return html.replace(/<[^>]+>/g, '\n').replace(/\n+/g, '\n').trim()
}

// AI 结构化整理：把纪要整理为结构化 HTML + 提取待办
async function structureMeeting(contentHtml, { llmConfig }) {
  const plain = htmlToText(contentHtml)
  if (!llmConfig?.apiKey || !llmConfig.apiKey.trim()) {
    const lines = plain.split('\n').map((s) => s.trim()).filter(Boolean)
    const todos = lines
      .filter((l) => /待办|行动|todo|action|下一步|跟进|排期|截止/.test(l))
      .map((l) => ({ content: l.replace(/^[-*]\s*/, ''), owner: '', deadline: '', done: false }))
    const html = lines.length ? lines.map((l) => `<p>${l}</p>`).join('') : contentHtml
    return { html, todos, usedFallback: true }
  }
  try {
    const tpl = useStore.getState().getPrompt('meeting_struct')
    const prompt = (tpl || '').replace(/\{\{meeting_text\}\}/g, plain)
    const raw = await callLLM({
      providerId: llmConfig.provider,
      apiKey: llmConfig.apiKey,
      model: llmConfig.model,
      messages: [
        { role: 'system', content: '你只输出 JSON，键为 html 与 todos。' },
        { role: 'user', content: prompt },
      ],
      opts: { temperature: 0.3, json: true },
    })
    const parsed = JSON.parse(raw)
    const todos = (Array.isArray(parsed.todos) ? parsed.todos : []).map((t) => ({
      content: (t.content || '').toString().trim(),
      owner: (t.owner || '').toString().trim(),
      deadline: (t.deadline || '').toString().trim(),
      done: false,
    })).filter((t) => t.content)
    return { html: parsed.html || contentHtml, todos, usedFallback: false }
  } catch (e) {
    return { html: contentHtml, todos: [], usedFallback: true, error: e.message }
  }
}

function ToolBtn({ active, onClick, children, label }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      title={label}
      className={`w-7 h-7 rounded flex items-center justify-center text-sm ${active ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-100'}`}
    >
      {children}
    </button>
  )
}

export default function Meetings() {
  const store = useStore()
  const { meetings, customers, projects, addMeeting, updateMeeting, deleteMeeting, todosToTasks } = store
  const llmConfig = store.llmConfig
  const workspace = store.workspaces[store.activeWorkspaceId]
  const perms = getPermissions(workspace)
  const canEdit = perms.canEdit

  const visible = useMemo(
    () => filterByVisibility(meetings, workspace, (m) => m.ownerId),
    [meetings, workspace]
  )

  const [selectedId, setSelectedId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [structuring, setStructuring] = useState(false)
  const [structMsg, setStructMsg] = useState(null)
  const [convMsg, setConvMsg] = useState(null)

  const editor = useEditor({
    extensions: [StarterKit],
    content: '<p></p>',
    editorProps: { attributes: { class: 'prose prose-sm max-w-none min-h-[160px] px-3 py-2 focus:outline-none text-sm text-slate-700' } },
  })

  const selected = meetings.find((m) => m.id === selectedId) || null

  // 选中会议纪要 → 载入编辑器内容
  useEffect(() => {
    if (selected && editor) {
      editor.commands.setContent(selected.content || '<p></p>')
    }
  }, [selected, editor])

  function openNew() {
    setForm(emptyForm)
    setEditingId(null)
    setSelectedId(null)
    setShowForm(true)
    setStructMsg(null)
    setConvMsg(null)
  }
  function openEdit(m) {
    setForm({
      title: m.title,
      date: m.date,
      category: m.category,
      relatedCustomerIds: m.relatedCustomerIds || [],
      relatedProjectIds: m.relatedProjectIds || [],
      content: m.content || '<p></p>',
      todos: m.todos || [],
    })
    setEditingId(m.id)
    setSelectedId(null)
    setShowForm(true)
  }
  async function save() {
    if (!form.title.trim()) return
    const payload = { ...form, ownerId: store.org.currentMemberId, todos: form.todos || [] }
    if (editingId) updateMeeting(editingId, payload)
    else addMeeting(payload)
    setShowForm(false)
  }
  function toggleTodo(i) {
    const todos = selected.todos.map((t, j) => (j === i ? { ...t, done: !t.done } : t))
    updateMeeting(selected.id, { todos })
  }
  function updateTodo(i, patch) {
    const todos = selected.todos.map((t, j) => (j === i ? { ...t, ...patch } : t))
    updateMeeting(selected.id, { todos })
  }
  function addTodo() {
    const todos = [...(selected.todos || []), { content: '', owner: '', deadline: '', done: false }]
    updateMeeting(selected.id, { todos })
  }
  function removeTodo(i) {
    updateMeeting(selected.id, { todos: selected.todos.filter((_, j) => j !== i) })
  }

  async function handleStructure() {
    if (!selected || !editor) return
    setStructuring(true)
    setStructMsg(null)
    const res = await structureMeeting(editor.getHTML(), { llmConfig })
    if (editor && !res.usedFallback) editor.commands.setContent(res.html || '<p></p>')
    if (selected) {
      const mergedTodos = res.todos.length
        ? res.todos
        : (selected.todos || []).filter((t) => !t.done)
      updateMeeting(selected.id, { content: res.usedFallback ? selected.content : res.html, todos: mergedTodos })
    }
    setStructuring(false)
    setStructMsg(res.usedFallback ? { ok: false, msg: '未配置模型或调用失败，已用本地规则提取待办' } : { ok: true, msg: '已整理为结构化笔记并提取待办' })
  }

  function handleConvert() {
    if (!selected) return
    const conv = todosToTasks(selected.id, selected.todos || [])
    if (!conv.length) {
      setConvMsg({ ok: false, msg: '没有未完成的待办可转' })
      return
    }
    const converted = new Set(conv.map((c) => c.title))
    const newTodos = (selected.todos || []).map((t) => (converted.has(t.content) ? { ...t, done: true } : t))
    updateMeeting(selected.id, { todos: newTodos })
    setConvMsg({ ok: true, msg: `已将 ${conv.length} 条待办转为任务` })
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">会议纪要</h1>
          <p className="text-slate-500 text-sm mt-0.5">结构化记录会议结论，待办一键转任务{perms.viewScope === 'mine' && ' · 仅显示你参与的'}</p>
        </div>
        {canEdit && (
          <button onClick={openNew} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
            <Plus size={16} /> 新建纪要
          </button>
        )}
      </div>

      {/* 列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {visible.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
            <ClipboardList size={40} className="mb-3 text-slate-200" />
            <p className="text-sm">还没有会议纪要，点「新建纪要」开始</p>
          </div>
        )}
        {visible.map((m) => {
          const open = (m.todos || []).filter((t) => !t.done).length
          return (
            <button key={m.id} onClick={() => { setStructMsg(null); setConvMsg(null); setSelectedId(m.id) }} className="text-left bg-white rounded-xl border border-slate-200 p-4 hover:border-blue-300 hover:shadow-sm transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] px-2 py-0.5 rounded bg-pink-100 text-pink-700">{m.category}</span>
                <span className="text-xs text-slate-400 flex items-center gap-1"><CalendarDays size={12} />{m.date}</span>
              </div>
              <div className="font-semibold text-slate-800 text-sm leading-snug line-clamp-2">{m.title}</div>
              {m.aiSummary && <div className="text-xs text-slate-500 mt-2 line-clamp-2">{m.aiSummary}</div>}
              <div className="flex items-center gap-3 mt-3 text-[11px] text-slate-400">
                <span className="flex items-center gap-1"><Building2 size={11} />{(m.relatedCustomerIds || []).length} 客户</span>
                <span className="flex items-center gap-1"><ClipboardList size={11} />{open} 待办</span>
              </div>
            </button>
          )
        })}
      </div>

      {/* 详情弹窗 */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setSelectedId(null)}>
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white px-5 py-4 border-b border-slate-100 flex items-center justify-between rounded-t-2xl">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[11px] px-2 py-0.5 rounded bg-pink-100 text-pink-700 flex-shrink-0">{selected.category}</span>
                <h3 className="text-lg font-bold text-slate-800 truncate">{selected.title}</h3>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {canEdit && (
                  <button onClick={() => openEdit(selected)} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600"><Pencil size={15} /></button>
                )}
                {canEdit && (
                  <button onClick={() => { if (confirm('确认删除？')) { deleteMeeting(selected.id); setSelectedId(null) } }} className="p-1.5 rounded-md hover:bg-red-50 text-slate-400 hover:text-red-500"><Trash2 size={15} /></button>
                )}
                <button onClick={() => setSelectedId(null)} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400"><X size={18} /></button>
              </div>
            </div>

            <div className="p-5 space-y-5">
              {/* meta */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1"><CalendarDays size={13} />{selected.date}</span>
                <span className="flex items-center gap-1"><Building2 size={13} />{(selected.relatedCustomerIds || []).map((id) => customers.find((c) => c.id === id)?.name).filter(Boolean).join('、') || '未关联'}</span>
                <span className="flex items-center gap-1"><Users size={13} />{(selected.relatedProjectIds || []).map((id) => projects.find((p) => p.id === id)?.name).filter(Boolean).join('、') || '未关联项目'}</span>
              </div>

              {/* 内容编辑器 */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-slate-500">会议内容</span>
                  {canEdit && (
                    <button onClick={handleStructure} disabled={structuring} className="flex items-center gap-1 text-xs text-blue-600 hover:bg-blue-50 px-2 py-1 rounded-lg">
                      {structuring ? <Loader2 size={13} className="animate-spin" /> : <Bot size={13} />}
                      AI 结构化整理
                    </button>
                  )}
                </div>
                {canEdit ? (
                  <div className="border border-slate-200 rounded-xl">
                    <div className="flex items-center gap-1 px-2 py-1.5 border-b border-slate-100 bg-slate-50">
                      <ToolBtn label="加粗" active={editor?.isActive('bold')} onClick={() => editor?.chain().focus().toggleBold().run()}><b>B</b></ToolBtn>
                      <ToolBtn label="斜体" active={editor?.isActive('italic')} onClick={() => editor?.chain().focus().toggleItalic().run()}><i>I</i></ToolBtn>
                      <ToolBtn label="列表" active={editor?.isActive('bulletList')} onClick={() => editor?.chain().focus().toggleBulletList().run()}>•</ToolBtn>
                      <ToolBtn label="标题" active={editor?.isActive('heading', { level: 3 })} onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}><span className="text-xs">H</span></ToolBtn>
                    </div>
                    <EditorContent editor={editor} />
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: selected.content || '<p></p>' }} />
                )}
                {canEdit && (
                  <button onClick={() => editor && updateMeeting(selected.id, { content: editor.getHTML() })} className="mt-2 text-xs text-slate-500 hover:text-blue-600 flex items-center gap-1">
                    <CheckCircle2 size={13} /> 保存内容
                  </button>
                )}
                {structMsg && (
                  <div className={`flex items-center gap-1.5 text-xs mt-2 px-2.5 py-1.5 rounded-lg ${structMsg.ok ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-amber-50 text-amber-600 border border-amber-200'}`}>
                    {structMsg.ok ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
                    {structMsg.msg}
                  </div>
                )}
              </div>

              {/* 待办 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-500 flex items-center gap-1"><ClipboardList size={13} />待办 / 行动项（{(selected.todos || []).filter((t) => !t.done).length} 未完成）</span>
                  {canEdit && (
                    <button onClick={handleConvert} className="flex items-center gap-1 text-xs bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded-lg">
                      <Send size={12} /> 一键转任务
                    </button>
                  )}
                </div>
                {(selected.todos || []).length === 0 ? (
                  <div className="text-xs text-slate-300 border border-dashed border-slate-200 rounded-lg py-4 text-center">暂无待办</div>
                ) : (
                  <div className="space-y-1.5">
                    {selected.todos.map((t, i) => (
                      <div key={i} className="flex items-center gap-2 bg-slate-50 rounded-lg px-2.5 py-2">
                        <input type="checkbox" checked={!!t.done} disabled={!canEdit} onChange={() => toggleTodo(i)} className="rounded" />
                        {canEdit ? (
                          <input
                            value={t.content}
                            onChange={(e) => updateTodo(i, { content: e.target.value })}
                            className={`flex-1 text-sm bg-transparent border-0 focus:outline-none ${t.done ? 'line-through text-slate-400' : 'text-slate-700'}`}
                          />
                        ) : (
                          <span className={`flex-1 text-sm ${t.done ? 'line-through text-slate-400' : 'text-slate-700'}`}>{t.content}</span>
                        )}
                        {canEdit && (
                          <>
                            <input
                              value={t.owner || ''}
                              onChange={(e) => updateTodo(i, { owner: e.target.value })}
                              placeholder="负责人"
                              className="w-20 text-xs border border-slate-200 rounded px-1.5 py-1 text-slate-600"
                            />
                            <input
                              type="date"
                              value={t.deadline || ''}
                              onChange={(e) => updateTodo(i, { deadline: e.target.value })}
                              className="text-xs border border-slate-200 rounded px-1.5 py-1 text-slate-600"
                            />
                            <button onClick={() => removeTodo(i)} className="text-slate-300 hover:text-red-500"><X size={14} /></button>
                          </>
                        )}
                      </div>
                    ))}
                    {canEdit && (
                      <button onClick={addTodo} className="text-xs text-blue-600 hover:underline flex items-center gap-1"><Plus size={12} />添加待办</button>
                    )}
                  </div>
                )}
                {convMsg && (
                  <div className={`flex items-center gap-1.5 text-xs mt-2 px-2.5 py-1.5 rounded-lg ${convMsg.ok ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-amber-50 text-amber-600 border border-amber-200'}`}>
                    {convMsg.ok ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
                    {convMsg.msg}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 表单弹窗 */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">{editingId ? '编辑纪要' : '新建纪要'}</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-500">标题 *</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500">日期</label>
                  <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-xs text-slate-500">分类</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white">
                    {MEETING_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-500">关联客户</label>
                <select multiple value={form.relatedCustomerIds} onChange={(e) => setForm({ ...form, relatedCustomerIds: Array.from(e.target.selectedOptions, (o) => o.value) })} className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white h-20">
                  {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500">关联项目</label>
                <select multiple value={form.relatedProjectIds} onChange={(e) => setForm({ ...form, relatedProjectIds: Array.from(e.target.selectedOptions, (o) => o.value) })} className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white h-20">
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500">内容（支持简单富文本）</label>
                <textarea value={htmlToText(form.content)} onChange={(e) => setForm({ ...form, content: `<p>${e.target.value.replace(/\n/g, '</p><p>')}</p>` })} rows={4} className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
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
