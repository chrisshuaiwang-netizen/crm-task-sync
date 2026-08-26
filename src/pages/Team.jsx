import { useState } from 'react'
import useStore from '../store/useStore'
import { ROLES, ROLE_KEYS, getPermissions } from '../constants'
import { UserCog, UserPlus, Check, ShieldCheck, Eye, Pencil, Users2, UserX } from 'lucide-react'

const PERM_LABEL = {
  viewScope: { all: '可见全部数据', mine: '仅看自己负责的' },
  canEdit: '可增改任务/客户',
  canManageMembers: '可管理成员',
  canManageCustomers: '可管理客户',
}

export default function Team() {
  const org = useStore((s) => s.org)
  const workspace = useStore((s) => s.workspaces[s.activeWorkspaceId])
  const addMember = useStore((s) => s.addMember)
  const updateMember = useStore((s) => s.updateMember)
  const removeMember = useStore((s) => s.removeMember)
  const setCurrentMember = useStore((s) => s.setCurrentMember)

  const me = org.members.find((m) => m.id === org.currentMemberId)
  const perms = getPermissions(workspace)
  const canManage = perms.canManageMembers

  const [name, setName] = useState('')
  const [role, setRole] = useState('member')

  function handleAdd() {
    if (!name.trim()) return
    addMember(name.trim(), role)
    setName('')
    setRole('member')
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center gap-2">
          <UserCog size={22} className="text-blue-600" />
          团队与权限
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          工作区「{workspace?.name}」· 当前身份：<b>{me?.name}</b>（{ROLES[me?.role]?.name}）
        </p>
      </div>

      {/* 角色权限说明 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        {ROLE_KEYS.map((key) => {
          const r = ROLES[key]
          const p = r.permissions
          return (
            <div key={key} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck size={16} className="text-blue-600" />
                <span className="font-semibold text-slate-800">{r.name}</span>
              </div>
              <p className="text-xs text-slate-500 mb-3 leading-relaxed">{r.desc}</p>
              <ul className="space-y-1 text-xs">
                <li className="flex items-center gap-1.5 text-slate-600">
                  <Eye size={12} className="text-slate-400" />
                  {PERM_LABEL.viewScope[p.viewScope]}
                </li>
                {p.canEdit && (
                  <li className="flex items-center gap-1.5 text-slate-600">
                    <Pencil size={12} className="text-slate-400" />
                    {PERM_LABEL.canEdit}
                  </li>
                )}
                {p.canManageMembers && (
                  <li className="flex items-center gap-1.5 text-slate-600">
                    <Users2 size={12} className="text-slate-400" />
                    {PERM_LABEL.canManageMembers}
                  </li>
                )}
                {p.canManageCustomers && (
                  <li className="flex items-center gap-1.5 text-slate-600">
                    <UserX size={12} className="text-slate-400" />
                    {PERM_LABEL.canManageCustomers}
                  </li>
                )}
              </ul>
            </div>
          )
        })}
      </div>

      {/* 成员列表 */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
          <span className="font-semibold text-slate-800">成员（{org.members.length}）</span>
        </div>

        <div className="divide-y divide-slate-50">
          {org.members.map((m) => {
            const isMe = m.id === org.currentMemberId
            return (
              <div key={m.id} className="px-4 py-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-500 text-white text-sm flex items-center justify-center flex-shrink-0">
                  {m.name.slice(0, 1)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-800 font-medium truncate">{m.name}</span>
                    {isMe && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                        当前身份
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400">{ROLES[m.role]?.name}</div>
                </div>

                {canManage ? (
                  <select
                    value={m.role}
                    onChange={(e) => updateMember(m.id, { role: e.target.value })}
                    className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {ROLE_KEYS.map((k) => (
                      <option key={k} value={k}>
                        {ROLES[k].name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="text-xs text-slate-400 px-2 py-1">{ROLES[m.role]?.name}</span>
                )}

                {!isMe && (
                  <button
                    onClick={() => setCurrentMember(m.id)}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-blue-600 hover:bg-blue-50 rounded-lg"
                    title="以该成员身份操作"
                  >
                    <Check size={13} />
                    切换身份
                  </button>
                )}

                {canManage && org.members.length > 1 && (
                  <button
                    onClick={() => removeMember(m.id)}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                    title="移除成员"
                  >
                    <UserX size={15} />
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {/* 添加成员 */}
        {canManage && (
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              placeholder="新成员姓名"
              className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="sm:w-32 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {ROLE_KEYS.map((k) => (
                <option key={k} value={k}>
                  {ROLES[k].name}
                </option>
              ))}
            </select>
            <button
              onClick={handleAdd}
              className="flex items-center justify-center gap-1.5 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg"
            >
              <UserPlus size={15} />
              添加
            </button>
          </div>
        )}
      </div>

      <p className="text-slate-400 text-xs mt-4 leading-relaxed">
        说明：成员 / 访客 在「任务」「客户」中仅能看到自己负责（ownerId 为自己）的数据；管理员可见全部。新建任务 / 客户会自动归属到当前操作身份。当前为本地多工作区模拟，数据隔离仅在当前浏览器内生效。
      </p>
    </div>
  )
}
