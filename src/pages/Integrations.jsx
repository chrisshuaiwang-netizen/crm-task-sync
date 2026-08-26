import { useState } from 'react'
import { Plus, Pencil, Trash2, X, Plug, Check, AlertTriangle, ExternalLink } from 'lucide-react'
import useStore from '../store/useStore'
import { INTEGRATION_TYPES, INTEGRATION_TYPE_LABELS } from '../constants'

const emptyForm = { name: '', type: 'webhook', endpoint: '', apiKey: '', enabled: true, description: '' }

export default function Integrations() {
  const store = useStore()
  const { integrations, addIntegration, updateIntegration, deleteIntegration } = store
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)

  function openNew() { setForm(emptyForm); setEditingId(null); setShowForm(true) }
  function openEdit(it) { setForm({ ...it }); setEditingId(it.id); setShowForm(true) }
  function save() {
    if (!form.name.trim()) return
    if (editingId) updateIntegration(editingId, form)
    else addIntegration(form)
    setShowForm(false)
  }

  return (
    <div className="p-5 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold text-slate-800">集成中心</h1>
        <button onClick={openNew} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Plus size={16} /> 新增集成
        </button>
      </div>
      <p className="text-slate-500 text-sm mb-6">配置 MCP 服务 / 画 Demo 平台，需求分析器可将生成的原型与需求一键推送到此处，与业务侧画板平台对齐功能。</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {integrations.map((it) => (
          <div key={it.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${it.enabled ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                  <Plug size={18} />
                </div>
                <div>
                  <div className="font-semibold text-slate-800">{it.name}</div>
                  <div className="text-xs text-slate-400">{INTEGRATION_TYPE_LABELS[it.type] || it.type}</div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => openEdit(it)} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600"><Pencil size={14} /></button>
                <button onClick={() => { if (confirm('确认删除该集成？')) deleteIntegration(it.id) }} className="p-1.5 rounded-md hover:bg-red-50 text-slate-400 hover:text-red-500"><Trash2 size={14} /></button>
              </div>
            </div>
            <p className="text-sm text-slate-500 mt-3 leading-relaxed">{it.description || INTEGRATION_TYPES.find((t) => t.id === it.type)?.desc}</p>
            <div className="mt-3 text-xs text-slate-400 break-all">
              {it.endpoint ? <span className="inline-flex items-center gap-1"><ExternalLink size={12} />{it.endpoint}</span> : <span className="text-amber-500">未配置地址</span>}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className={`text-[11px] px-2 py-0.5 rounded ${it.enabled ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                {it.enabled ? '已启用' : '已停用'}
              </span>
              {!it.endpoint && <span className="text-[11px] px-2 py-0.5 rounded bg-amber-100 text-amber-600 flex items-center gap-1"><AlertTriangle size={11} />需填写地址才能推送</span>}
            </div>
          </div>
        ))}
        {!integrations.length && (
          <div className="col-span-full text-center text-slate-400 text-sm py-10 bg-white rounded-2xl border border-dashed border-slate-200">暂无集成，点击「新增集成」开始配置</div>
        )}
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800">
        <b>如何使用：</b>在「需求池」中打开某条需求 → 点击「AI 分析」→ 评估难度与开发周期 → 选择「继续推进」→ 系统生成需求文档与原型 → 点击「发布到画板」选择已启用的集成目标即可推送。
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">{editingId ? '编辑集成' : '新增集成'}</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-500">名称 *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="如：Figma 团队空间" className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-xs text-slate-500">类型</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white">
                  {INTEGRATION_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500">地址 / Endpoint</label>
                <input value={form.endpoint} onChange={(e) => setForm({ ...form, endpoint: e.target.value })} placeholder="https://.../webhook" className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-xs text-slate-500">API Key / Token（可选）</label>
                <input value={form.apiKey} onChange={(e) => setForm({ ...form, apiKey: e.target.value })} placeholder="Bearer Token" className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-xs text-slate-500">描述</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" checked={form.enabled} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} />
                启用该集成
              </label>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={save} className="flex-1 flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-medium"><Check size={15} /> 保存</button>
              <button onClick={() => setShowForm(false)} className="px-4 text-slate-500 hover:bg-slate-100 py-2.5 rounded-lg text-sm">取消</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
