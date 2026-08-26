import { useState, useMemo } from 'react'
import { Plus, Pencil, Trash2, Search, BadgeDollarSign, X, TrendingUp } from 'lucide-react'
import useStore from '../store/useStore'
import { filterByVisibility, getPermissions } from '../constants'
import { DEAL_STAGES, DEAL_STAGE_COLORS, CUSTOMER_INDUSTRIES } from '../constants'

const emptyForm = { name: '', customerId: '', amount: '', stage: '初步接触', expectedCloseDate: '', actualCloseDate: '', status: '进行中' }

export default function Deals() {
  const store = useStore()
  const { deals, customers, addDeal, updateDeal, deleteDeal } = store
  const perms = getPermissions(store.workspaces[store.activeWorkspaceId])
  const canEdit = perms.canEdit

  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState('全部')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)

  const visible = useMemo(
    () => filterByVisibility(deals, store.workspaces[store.activeWorkspaceId], (d) => d.ownerId),
    [deals, store.workspaces, store.activeWorkspaceId]
  )
  const list = visible.filter((d) => (stageFilter === '全部' || d.stage === stageFilter) && (customers.find((c) => c.id === d.customerId)?.name || '').includes(search.trim()))

  const totalAmount = visible.filter((d) => d.stage !== '已流失').reduce((s, d) => s + (Number(d.amount) || 0), 0)
  const wonAmount = visible.filter((d) => d.stage === '已成交').reduce((s, d) => s + (Number(d.amount) || 0), 0)

  function openNew() { setForm(emptyForm); setEditingId(null); setShowForm(true) }
  function openEdit(d) { setForm({ ...d }); setEditingId(d.id); setShowForm(true) }
  function save() {
    if (!form.name.trim()) return
    if (editingId) updateDeal(editingId, form)
    else addDeal({ ...form, amount: Number(form.amount) || 0 })
    setShowForm(false)
  }

  return (
    <div className="p-5 md:p-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">成单管理</h1>
          <p className="text-slate-500 text-sm mt-0.5">跟踪商机阶段与金额回款</p>
        </div>
        {canEdit && (
          <button onClick={openNew} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
            <Plus size={16} /> 新增成单
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <Stat label="进行中金额" value={`¥${totalAmount}万`} icon={BadgeDollarSign} />
        <Stat label="已成交金额" value={`¥${wonAmount}万`} icon={TrendingUp} />
        <Stat label="成单数" value={visible.length} icon={BadgeDollarSign} />
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索客户" className="pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        {['全部', ...DEAL_STAGES].map((s) => (
          <button key={s} onClick={() => setStageFilter(s)} className={`text-xs px-2.5 py-1.5 rounded-lg transition-colors ${stageFilter === s ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{s}</button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs">
            <tr>
              <th className="text-left px-4 py-2.5 font-medium">成单名称</th>
              <th className="text-left px-4 py-2.5 font-medium">客户</th>
              <th className="text-left px-4 py-2.5 font-medium">金额(万)</th>
              <th className="text-left px-4 py-2.5 font-medium">阶段</th>
              <th className="text-left px-4 py-2.5 font-medium">预计成交</th>
              {canEdit && <th className="text-right px-4 py-2.5 font-medium">操作</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {list.map((d) => (
              <tr key={d.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-800">{d.name}</td>
                <td className="px-4 py-3 text-slate-600">{customers.find((c) => c.id === d.customerId)?.name || '—'}</td>
                <td className="px-4 py-3 text-emerald-600 font-medium">¥{d.amount}万</td>
                <td className="px-4 py-3"><span className={`text-[11px] px-1.5 py-0.5 rounded ${DEAL_STAGE_COLORS[d.stage]}`}>{d.stage}</span></td>
                <td className="px-4 py-3 text-slate-500">{d.expectedCloseDate || '—'}</td>
                {canEdit && (
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openEdit(d)} className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600"><Pencil size={13} /></button>
                    <button onClick={() => { if (confirm('确认删除？')) deleteDeal(d.id) }} className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-500"><Trash2 size={13} /></button>
                  </td>
                )}
              </tr>
            ))}
            {!list.length && <tr><td colSpan={canEdit ? 6 : 5} className="px-4 py-10 text-center text-slate-400">暂无成单记录</td></tr>}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">{editingId ? '编辑成单' : '新增成单'}</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-500">成单名称 *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
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
                  <label className="text-xs text-slate-500">金额(万)</label>
                  <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500">阶段</label>
                  <select value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value })} className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white">
                    {DEAL_STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500">预计成交日</label>
                  <input type="date" value={form.expectedCloseDate} onChange={(e) => setForm({ ...form, expectedCloseDate: e.target.value })} className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
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

function Stat({ label, value, icon: Icon }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center"><Icon size={17} className="text-emerald-600" /></div>
      <div>
        <div className="text-xs text-slate-400">{label}</div>
        <div className="text-lg font-bold text-slate-800">{value}</div>
      </div>
    </div>
  )
}
