import { useState } from 'react'
import { ShieldCheck, Eye, Pencil, Users2, UserX, Building2, SlidersHorizontal, Check, X } from 'lucide-react'
import useStore from '../store/useStore'
import { ROLES, ROLE_KEYS } from '../constants'

// 权限矩阵定义（与 ROLES.permissions 对齐）
const PERM_ROWS = [
  { key: 'viewScope', label: '数据可见范围', desc: '能查看哪些数据', render: (v) => (v === 'all' ? '全部数据' : '仅自己负责') },
  { key: 'canEdit', label: '编辑任务/客户', desc: '可增删改任务、客户、需求等', render: (v) => (v ? '允许' : '—') },
  { key: 'canManageMembers', label: '管理成员', desc: '添加 / 移除成员、切换身份', render: (v) => (v ? '允许' : '—') },
  { key: 'canManageCustomers', label: '管理客户', desc: '客户的新建与删除权限', render: (v) => (v ? '允许' : '—') },
  { key: 'canManageSystem', label: '系统配置', desc: 'Agent 管控、审计、系统设置', render: (v) => (v ? '允许' : '—') },
]

const SCOPE_ICON = { all: Eye, mine: UserX }

export default function Permissions() {
  const org = useStore((s) => s.org)
  const updateMember = useStore((s) => s.updateMember)
  const me = org.members.find((m) => m.id === org.currentMemberId)
  const myPerms = ROLES[me?.role]?.permissions
  const canManage = myPerms?.canManageMembers || myPerms?.canManageSystem

  const [roleFilter, setRoleFilter] = useState('all')

  const matrix = ROLE_KEYS.map((key) => ({ key, role: ROLES[key] }))
  const filteredMembers = roleFilter === 'all' ? org.members : org.members.filter((m) => m.role === roleFilter)

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center gap-2">
          <SlidersHorizontal size={22} className="text-blue-600" />
          权限配置
        </h1>
        <p className="text-slate-500 text-sm mt-1">基于角色的访问控制（RBAC）。当前身份：<b>{me?.name}</b>（{ROLES[me?.role]?.name}）</p>
      </div>

      {/* 权限矩阵 */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-6">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
          <ShieldCheck size={16} className="text-blue-600" />
          <span className="font-semibold text-slate-800">角色权限矩阵</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500">
                <th className="text-left font-medium px-4 py-2.5">权限项</th>
                {matrix.map(({ key, role }) => (
                  <th key={key} className="text-center font-medium px-4 py-2.5 min-w-[88px]">{role.name}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {PERM_ROWS.map((row) => (
                <tr key={row.key}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-700">{row.label}</div>
                    <div className="text-xs text-slate-400">{row.desc}</div>
                  </td>
                  {matrix.map(({ key, role }) => {
                    const v = role.permissions[row.key]
                    const on = row.key === 'viewScope' ? v === 'all' : v
                    return (
                      <td key={key} className="px-4 py-3 text-center">
                        {row.key === 'viewScope' ? (
                          <span className="inline-flex items-center gap-1 text-xs text-slate-600">
                            {(() => { const I = SCOPE_ICON[v]; return <I size={13} className="text-slate-400" /> })()}
                            {row.render(v)}
                          </span>
                        ) : on ? (
                          <Check size={16} className="mx-auto text-green-500" />
                        ) : (
                          <X size={16} className="mx-auto text-slate-300" />
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 成员角色分配 */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
          <span className="font-semibold text-slate-800 flex items-center gap-2"><Users2 size={16} className="text-blue-600" />成员角色（{org.members.length}）</span>
          <div className="flex items-center gap-1">
            {['all', ...ROLE_KEYS].map((k) => (
              <button key={k} onClick={() => setRoleFilter(k)} className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${roleFilter === k ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                {k === 'all' ? '全部' : ROLES[k].name}
              </button>
            ))}
          </div>
        </div>
        <div className="divide-y divide-slate-50">
          {filteredMembers.map((m) => {
            const isMe = m.id === org.currentMemberId
            return (
              <div key={m.id} className="px-4 py-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-500 text-white text-sm flex items-center justify-center flex-shrink-0">{m.name.slice(0, 1)}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-800 font-medium truncate">{m.name}</span>
                    {isMe && <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">当前身份</span>}
                  </div>
                  <div className="text-xs text-slate-400 flex items-center gap-1">
                    <Building2 size={11} />{ROLES[m.role]?.name} · 可见 {ROLES[m.role]?.permissions.viewScope === 'all' ? '全部' : '自己'}
                  </div>
                </div>
                {canManage ? (
                  <select
                    value={m.role}
                    onChange={(e) => updateMember(m.id, { role: e.target.value })}
                    className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {ROLE_KEYS.map((k) => <option key={k} value={k}>{ROLES[k].name}</option>)}
                  </select>
                ) : (
                  <span className="text-xs text-slate-400 px-2 py-1">{ROLES[m.role]?.name}</span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <p className="text-slate-400 text-xs mt-4 leading-relaxed">
        说明：权限在「任务 / 客户 / 需求 / 项目」等页面通过 viewScope 过滤数据——成员 / 访客只能看到 ownerId 为自己的数据，管理员可见全部。修改角色会立即生效。当前为本地多工作区模拟，无后端鉴权。
      </p>
    </div>
  )
}
