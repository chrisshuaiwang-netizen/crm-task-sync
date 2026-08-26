import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Users,
  Phone,
  Building2,
  Tag,
  CalendarDays,
  ClipboardList,
  BadgeDollarSign,
  X,
} from 'lucide-react'
import useStore from '../store/useStore'
import { filterByVisibility, getPermissions } from '../constants'
import {
  CUSTOMER_INDUSTRIES,
  INDUSTRY_COLORS,
  PRIORITY_BADGE,
  CUSTOMER_STATUSES,
  CUSTOMER_STATUS_COLORS,
} from '../constants'

const emptyForm = { name: '', industry: '金融', priority: '中', status: '初步接触', contact: '', phone: '', notes: '' }

export default function Customers() {
  const store = useStore()
  const { customers, requirements, tasks, deals, org, addCustomer, updateCustomer, deleteCustomer } = store
  const navigate = useNavigate()
  const perms = getPermissions(store.workspaces[store.activeWorkspaceId])
  const canEdit = perms.canEdit && perms.canManageCustomers

  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [selectedId, setSelectedId] = useState(null)

  const visible = useMemo(
    () => filterByVisibility(customers, store.workspaces[store.activeWorkspaceId], (c) => c.ownerId),
    [customers, store.workspaces, store.activeWorkspaceId]
  )
  const list = visible.filter((c) => c.name.includes(search.trim()))

  const selected = customers.find((c) => c.id === selectedId)
  const relatedReqs = selected ? requirements.filter((r) => r.customerId === selected.id) : []
  const relatedTasks = selected ? tasks.filter((t) => t.customerId === selected.id) : []
  const relatedDeals = selected ? deals.filter((d) => d.customerId === selected.id) : []

  function openNew() {
    setForm(emptyForm)
    setEditingId(null)
    setShowForm(true)
  }
  function openEdit(c) {
    setForm({ name: c.name, industry: c.industry, priority: c.priority, status: c.status, contact: c.contact || '', phone: c.phone || '', notes: c.notes || '' })
    setEditingId(c.id)
    setShowForm(true)
  }
  function save() {
    if (!form.name.trim()) return
    if (editingId) updateCustomer(editingId, form)
    else addCustomer(form)
    setShowForm(false)
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] md:h-screen">
      {/* 列表 */}
      <div className="flex-1 min-w-0 flex flex-col border-r border-slate-200 bg-white">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">客户列表</h1>
            <p className="text-slate-500 text-sm mt-0.5">共 {visible.length} 个客户（按权限可见）</p>
          </div>
          {canEdit && (
            <button onClick={openNew} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              <Plus size={16} /> 新增客户
            </button>
          )}
        </div>

        <div className="px-5 py-3 border-b border-slate-100">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索客户名称"
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {list.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedId(c.id)}
              className={`w-full text-left p-3.5 rounded-xl border transition-colors ${selectedId === c.id ? 'border-blue-300 bg-blue-50' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <Building2 size={16} className="text-slate-400" />
                <span className="font-medium text-slate-800">{c.name}</span>
                <span className={`text-[11px] px-1.5 py-0.5 rounded ${INDUSTRY_COLORS[c.industry] || 'bg-slate-100 text-slate-600'}`}>{c.industry}</span>
                <span className={`text-[11px] px-1.5 py-0.5 rounded ${CUSTOMER_STATUS_COLORS[c.status]}`}>{c.status}</span>
                <span className={`ml-auto text-[11px] px-1.5 py-0.5 rounded ${PRIORITY_BADGE[c.priority]}`}>{c.priority}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                {c.contact && <span className="flex items-center gap-1"><Users size={12} />{c.contact}</span>}
                {c.phone && <span className="flex items-center gap-1"><Phone size={12} />{c.phone}</span>}
                <span className="flex items-center gap-1"><ClipboardList size={12} />{relatedTasks.filter((t) => t.customerId === c.id).length} 任务</span>
              </div>
            </button>
          ))}
          {list.length === 0 && <div className="text-center text-slate-400 text-sm py-10">暂无客户</div>}
        </div>
      </div>

      {/* 详情 */}
      {selected && (
        <div className="hidden md:flex w-96 flex-col bg-white overflow-y-auto">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <div className="text-lg font-bold text-slate-800">{selected.name}</div>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-[11px] px-1.5 py-0.5 rounded ${CUSTOMER_STATUS_COLORS[selected.status]}`}>{selected.status}</span>
                <span className={`text-[11px] px-1.5 py-0.5 rounded ${PRIORITY_BADGE[selected.priority]}`}>{selected.priority}</span>
              </div>
            </div>
            {canEdit && (
              <div className="flex items-center gap-1">
                <button onClick={() => openEdit(selected)} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600"><Pencil size={14} /></button>
                <button onClick={() => { if (confirm('确认删除该客户？关联任务将一并移除')) deleteCustomer(selected.id) }} className="p-1.5 rounded-md hover:bg-red-50 text-slate-400 hover:text-red-500"><Trash2 size={14} /></button>
              </div>
            )}
          </div>

          <div className="p-5 space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <Field icon={Building2} label="行业" value={selected.industry} />
              <Field icon={Tag} label="负责人" value={org.members.find((m) => m.id === selected.ownerId)?.name || selected.owner || '—'} />
              <Field icon={Users} label="联系人" value={selected.contact || '—'} />
              <Field icon={Phone} label="电话" value={selected.phone || '—'} />
            </div>
            {selected.notes && (
              <div>
                <div className="text-xs text-slate-400 mb-1">备注</div>
                <div className="text-slate-700 text-xs bg-slate-50 rounded-lg p-3">{selected.notes}</div>
              </div>
            )}

            <Section title={`关联需求（${relatedReqs.length}）`} icon={ClipboardList}>
              {relatedReqs.map((r) => (
                <div key={r.id} className="text-xs text-slate-600 py-1 border-b border-slate-50">{r.title}</div>
              ))}
              {!relatedReqs.length && <Empty />}
            </Section>

            <Section title={`关联任务（${relatedTasks.length}）`} icon={CalendarDays}>
              {relatedTasks.map((t) => (
                <button key={t.id} onClick={() => navigate('/tasks')} className="w-full text-left text-xs text-slate-600 py-1 border-b border-slate-50 hover:text-blue-600">{t.title} · {t.status}</button>
              ))}
              {!relatedTasks.length && <Empty />}
            </Section>

            <Section title={`成单记录（${relatedDeals.length}）`} icon={BadgeDollarSign}>
              {relatedDeals.map((d) => (
                <div key={d.id} className="text-xs text-slate-600 py-1 border-b border-slate-50 flex justify-between"><span>{d.name}</span><span className="text-emerald-600">¥{d.amount}万</span></div>
              ))}
              {!relatedDeals.length && <Empty />}
            </Section>
          </div>
        </div>
      )}

      {/* 表单弹窗 */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">{editingId ? '编辑客户' : '新增客户'}</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <Input label="客户名称 *" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
              <div className="grid grid-cols-2 gap-3">
                <Select label="行业" value={form.industry} options={CUSTOMER_INDUSTRIES} onChange={(v) => setForm({ ...form, industry: v })} />
                <Select label="状态" value={form.status} options={CUSTOMER_STATUSES} onChange={(v) => setForm({ ...form, status: v })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Select label="优先级" value={form.priority} options={['高', '中', '低']} onChange={(v) => setForm({ ...form, priority: v })} />
                <Input label="联系人" value={form.contact} onChange={(v) => setForm({ ...form, contact: v })} />
              </div>
              <Input label="联系电话" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
              <div>
                <label className="text-xs text-slate-500">备注</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
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

function Field({ icon: Icon, label, value }) {
  return (
    <div>
      <div className="text-xs text-slate-400 mb-0.5 flex items-center gap-1"><Icon size={12} />{label}</div>
      <div className="text-slate-700">{value}</div>
    </div>
  )
}
function Section({ title, icon: Icon, children }) {
  return (
    <div>
      <div className="text-xs font-semibold text-slate-500 mb-1.5 flex items-center gap-1"><Icon size={13} />{title}</div>
      {children}
    </div>
  )
}
function Empty() {
  return <div className="text-xs text-slate-300 py-1">暂无</div>
}
function Input({ label, value, onChange }) {
  return (
    <div>
      <label className="text-xs text-slate-500">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
    </div>
  )
}
function Select({ label, value, options, onChange }) {
  return (
    <div>
      <label className="text-xs text-slate-500">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}
