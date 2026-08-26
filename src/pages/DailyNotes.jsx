import { useState, useCallback, useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import {
  Plus,
  Trash2,
  AlertTriangle,
  Calendar,
  MessageSquare,
  Users,
  StickyNote,
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Heading2,
  Heading3,
  Quote,
  Minus,
  X,
  CheckCircle2,
  Sparkles,
  Loader2,
} from 'lucide-react'
import useStore from '../store/useStore'
import { summarizeDailyNote } from '../utils/aiEngine'

const NOTE_CATEGORIES = ['会议', '沟通', '其他']
const NOTE_CATEGORY_COLORS = {
  会议: 'bg-blue-100 text-blue-700',
  沟通: 'bg-purple-100 text-purple-700',
  其他: 'bg-slate-100 text-slate-600',
}
const NOTE_CATEGORY_ICON = {
  会议: Users,
  沟通: MessageSquare,
  其他: StickyNote,
}

function stripHtml(html) {
  if (!html) return ''
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

function getTodayStr() {
  return new Date().toISOString().split('T')[0]
}

// ── Tiptap Toolbar ────────────────────────────────────────────────────────

function ToolbarBtn({ onClick, active, title, children }) {
  return (
    <button
      onMouseDown={(e) => { e.preventDefault(); onClick() }}
      title={title}
      className={`p-1.5 rounded text-sm font-medium transition-colors ${
        active ? 'bg-slate-200 text-slate-900' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
      }`}
    >
      {children}
    </button>
  )
}

function Toolbar({ editor }) {
  if (!editor) return null
  return (
    <div className="flex items-center flex-wrap gap-0.5 px-3 py-2 border-b border-slate-200 bg-slate-50">
      <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="粗体">
        <Bold size={14} />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="斜体">
        <Italic size={14} />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="删除线">
        <Strikethrough size={14} />
      </ToolbarBtn>
      <div className="w-px h-5 bg-slate-200 mx-1" />
      <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="标题2">
        <Heading2 size={14} />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="标题3">
        <Heading3 size={14} />
      </ToolbarBtn>
      <div className="w-px h-5 bg-slate-200 mx-1" />
      <ToolbarBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="无序列表">
        <List size={14} />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="有序列表">
        <ListOrdered size={14} />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="引用">
        <Quote size={14} />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} active={false} title="分隔线">
        <Minus size={14} />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="代码块">
        <span className="text-xs font-mono">{'{ }'}</span>
      </ToolbarBtn>
    </div>
  )
}

// ── Editor Panel ──────────────────────────────────────────────────────────

function NoteEditor({ note, onSave, onDelete }) {
  const [title, setTitle] = useState(note?.title ?? '')
  const [date, setDate] = useState(note?.date ?? getTodayStr())
  const [category, setCategory] = useState(note?.category ?? '会议')
  const [dirty, setDirty] = useState(false)
  const [aiSummary, setAiSummary] = useState(note?.aiSummary ?? '')
  const [aiAnalyzing, setAiAnalyzing] = useState(false)

  const editor = useEditor({
    extensions: [StarterKit],
    content: note?.content ?? '',
    onUpdate: () => setDirty(true),
    editorProps: {
      attributes: {
        class: 'outline-none min-h-[280px] px-5 py-4 text-sm text-slate-700 leading-relaxed',
      },
    },
  })

  // Reset when switching notes
  useEffect(() => {
    if (editor && note) {
      editor.commands.setContent(note.content ?? '')
    }
    setTitle(note?.title ?? '')
    setDate(note?.date ?? getTodayStr())
    setCategory(note?.category ?? '会议')
    setAiSummary(note?.aiSummary ?? '')
    setDirty(false)
  }, [note?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleAiSummary() {
    setAiAnalyzing(true)
    setTimeout(() => {
      const result = summarizeDailyNote({ title, content: editor?.getHTML() ?? '', category })
      setAiSummary(result)
      setAiAnalyzing(false)
      setDirty(true)
    }, 900)
  }

  function handleSave() {
    if (!title.trim()) return
    onSave({ title, date, category, content: editor?.getHTML() ?? '', aiSummary })
    setDirty(false)
  }

  if (!note && note !== null) return null

  return (
    <div className="flex flex-col h-full">
      {/* Metadata row */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-200 flex-shrink-0">
        <input
          type="text"
          value={title}
          onChange={(e) => { setTitle(e.target.value); setDirty(true) }}
          placeholder="标题…"
          className="flex-1 text-base font-semibold text-slate-800 bg-transparent border-none outline-none placeholder-slate-300"
        />
        <input
          type="date"
          value={date}
          onChange={(e) => { setDate(e.target.value); setDirty(true) }}
          className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={category}
          onChange={(e) => { setCategory(e.target.value); setDirty(true) }}
          className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {NOTE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Toolbar */}
      <Toolbar editor={editor} />

      {/* Editor */}
      <div className="flex-1 overflow-y-auto rich-text-editor">
        <EditorContent editor={editor} />
      </div>

      {/* AI Summary */}
      {aiSummary && (
        <div className="mx-5 mb-3 flex-shrink-0 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2.5 flex items-start gap-2">
          <Sparkles size={13} className="text-blue-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-blue-600 mb-0.5">AI 总结</p>
            <p className="text-xs text-blue-700 leading-relaxed">{aiSummary}</p>
          </div>
          <button onClick={() => { setAiSummary(''); setDirty(true) }} className="text-blue-300 hover:text-blue-500 flex-shrink-0">
            <X size={13} />
          </button>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 flex-shrink-0 bg-white">
        <button
          onClick={() => onDelete && onDelete(note?.id)}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-500 transition-colors"
        >
          <Trash2 size={13} />
          删除
        </button>
        <div className="flex items-center gap-2">
          {dirty && <span className="text-xs text-slate-400">有未保存的修改</span>}
          <button
            onClick={handleAiSummary}
            disabled={aiAnalyzing}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-blue-500 disabled:opacity-50 transition-colors px-2 py-1"
          >
            {aiAnalyzing ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
            AI 总结
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim()}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <CheckCircle2 size={14} />
            保存
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────

export default function DailyNotes() {
  const { dailyNotes, addDailyNote, updateDailyNote, deleteDailyNote } = useStore()

  const [selectedId, setSelectedId] = useState(dailyNotes[0]?.id ?? null)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('全部')
  const [timeFilter, setTimeFilter] = useState('全部')
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)
  const [toast, setToast] = useState(null)
  const [isNew, setIsNew] = useState(false) // editing a new unsaved note
  const [newNote, setNewNote] = useState(null)

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(null), 2500) }

  function getWeekRange() {
    const today = new Date(); const day = today.getDay()
    const diff = today.getDate() - day + (day === 0 ? -6 : 1)
    const monday = new Date(today); monday.setDate(diff)
    const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6)
    const toStr = (d) => d.toISOString().split('T')[0]
    return { start: toStr(monday), end: toStr(sunday) }
  }
  function getMonthRange() {
    const now = new Date()
    const start = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
    const last = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    return { start, end: last.toISOString().split('T')[0] }
  }

  const todayStr = getTodayStr()

  const filteredNotes = dailyNotes
    .filter((n) => {
      if (search && !n.title.toLowerCase().includes(search.toLowerCase()) && !stripHtml(n.content).toLowerCase().includes(search.toLowerCase())) return false
      if (categoryFilter !== '全部' && n.category !== categoryFilter) return false
      if (timeFilter === '今天') return n.date === todayStr
      if (timeFilter === '本周') { const { start, end } = getWeekRange(); return n.date >= start && n.date <= end }
      if (timeFilter === '本月') { const { start, end } = getMonthRange(); return n.date >= start && n.date <= end }
      return true
    })
    .sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0))

  const selectedNote = isNew ? newNote : (filteredNotes.find((n) => n.id === selectedId) ?? null)

  function handleNewNote() {
    const blank = { id: '_new', title: '', content: '', date: getTodayStr(), category: '会议' }
    setNewNote(blank)
    setIsNew(true)
    setSelectedId(null)
  }

  const handleSave = useCallback((data) => {
    if (isNew) {
      addDailyNote(data)
      setIsNew(false)
      setNewNote(null)
      showToast('已保存')
      // Select the newly created note (it'll be at the right position)
    } else if (selectedId) {
      updateDailyNote(selectedId, data)
      showToast('已保存')
    }
  }, [isNew, selectedId, addDailyNote, updateDailyNote])

  function handleDelete(id) {
    if (!id || id === '_new') { setIsNew(false); setNewNote(null); return }
    setDeleteConfirmId(id)
  }

  function confirmDelete() {
    deleteDailyNote(deleteConfirmId)
    setDeleteConfirmId(null)
    if (selectedId === deleteConfirmId) {
      setSelectedId(filteredNotes.find((n) => n.id !== deleteConfirmId)?.id ?? null)
    }
    showToast('已删除')
  }

  return (
    <div className="flex h-screen">
      {/* ── Left Panel: Note List ────────────────────────────────────────── */}
      <div className="w-72 flex-shrink-0 flex flex-col border-r border-slate-200 bg-white">
        {/* Header */}
        <div className="px-4 py-4 border-b border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-base font-bold text-slate-800">日常事项</h1>
            <button
              onClick={handleNewNote}
              className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors"
            >
              <Plus size={13} />新建
            </button>
          </div>
          {/* Search */}
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索…"
            className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Filters */}
        <div className="px-3 py-2 border-b border-slate-100 space-y-1.5">
          {/* Time filter */}
          <div className="flex gap-1">
            {['全部', '今天', '本周', '本月'].map((f) => (
              <button
                key={f}
                onClick={() => setTimeFilter(f)}
                className={`flex-1 py-1 rounded text-xs font-medium transition-colors ${timeFilter === f ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
              >
                {f}
              </button>
            ))}
          </div>
          {/* Category filter */}
          <div className="flex gap-1">
            {['全部', ...NOTE_CATEGORIES].map((c) => (
              <button
                key={c}
                onClick={() => setCategoryFilter(c)}
                className={`flex-1 py-1 rounded text-xs font-medium transition-colors ${categoryFilter === c ? 'bg-slate-700 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Note List */}
        <div className="flex-1 overflow-y-auto">
          {/* New note placeholder in list */}
          {isNew && (
            <div className="px-4 py-3 bg-blue-50 border-b border-blue-100 cursor-pointer">
              <p className="text-xs font-medium text-blue-700">新建事项…</p>
            </div>
          )}
          {filteredNotes.length === 0 && !isNew ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-300">
              <StickyNote size={32} className="mb-2" />
              <p className="text-xs">暂无记录</p>
            </div>
          ) : (
            filteredNotes.map((note) => {
              const CatIcon = NOTE_CATEGORY_ICON[note.category] || StickyNote
              const preview = stripHtml(note.content)
              const isSelected = !isNew && selectedId === note.id
              return (
                <div
                  key={note.id}
                  onClick={() => { setSelectedId(note.id); setIsNew(false) }}
                  className={`px-4 py-3 cursor-pointer border-b border-slate-50 transition-colors ${isSelected ? 'bg-blue-50 border-l-2 border-l-blue-500' : 'hover:bg-slate-50'}`}
                >
                  <div className="flex items-start gap-2">
                    <CatIcon size={13} className={isSelected ? 'text-blue-500 mt-0.5' : 'text-slate-400 mt-0.5'} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold truncate leading-snug ${isSelected ? 'text-blue-800' : 'text-slate-700'}`}>
                        {note.title || '无标题'}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                        {preview || '暂无内容'}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${NOTE_CATEGORY_COLORS[note.category]}`}>{note.category}</span>
                        <span className="text-xs text-slate-300 flex items-center gap-0.5"><Calendar size={10} />{note.date}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
        <div className="px-4 py-2 border-t border-slate-100">
          <p className="text-xs text-slate-400">{dailyNotes.length} 条记录</p>
        </div>
      </div>

      {/* ── Right Panel: Editor ──────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        {selectedNote ? (
          <NoteEditor
            key={selectedNote.id}
            note={selectedNote}
            onSave={handleSave}
            onDelete={handleDelete}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-300">
            <StickyNote size={48} className="mb-3" />
            <p className="text-sm">选择或新建一条事项</p>
            <button onClick={handleNewNote} className="mt-4 text-blue-500 text-sm hover:underline">
              新建事项
            </button>
          </div>
        )}
      </div>

      {/* Delete Confirm */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle size={20} className="text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">确认删除</h3>
                <p className="text-sm text-slate-500 mt-0.5">此操作不可恢复</p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteConfirmId(null)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">取消</button>
              <button onClick={confirmDelete} className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium">确认删除</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium bg-green-600 text-white">
          <CheckCircle2 size={16} />{toast}
        </div>
      )}
    </div>
  )
}
