import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Bot,
  Users,
  BadgeDollarSign,
  ClipboardList,
  ListChecks,
  KanbanSquare,
  Video,
  FileText,
  BookOpen,
  BarChart3,
  Bell,
  UserCog,
  ShieldCheck,
  SlidersHorizontal,
  ScrollText,
  Settings,
  FileCode2,
  Lock,
  Zap,
  Plug,
} from 'lucide-react'
import useStore from '../store/useStore'

const navGroups = [
  {
    label: '智能工作台',
    items: [
      { to: '/assistant', label: '智能助手', icon: Bot, badge: 'AI', hero: true },
      { to: '/', label: 'Agent 工作台', icon: LayoutDashboard, end: true },
    ],
  },
  {
    label: '客户管理',
    items: [
      { to: '/customers', label: '客户列表', icon: Users },
      { to: '/deals', label: '成单管理', icon: BadgeDollarSign },
    ],
  },
  {
    label: '需求任务管理',
    items: [
      { to: '/requirements', label: '需求池', icon: ClipboardList },
      { to: '/tasks', label: '任务总览', icon: ListChecks },
      { to: '/projects', label: '项目看板', icon: KanbanSquare },
    ],
  },
  {
    label: '文档总结中心',
    items: [
      { to: '/meetings', label: '会议纪要', icon: Video },
      { to: '/reports', label: '报告管理', icon: FileText },
      { to: '/knowledge', label: '知识库 / 文件', icon: BookOpen },
    ],
  },
  {
    label: '数据分析',
    items: [
      { to: '/data-report', label: '数据报表中心', icon: BarChart3 },
      { to: '/messages', label: '消息中心', icon: Bell },
    ],
  },
  {
    label: '系统管理',
    items: [
      { to: '/team', label: '用户角色', icon: UserCog },
      { to: '/permissions', label: '权限配置', icon: ShieldCheck },
      { to: '/agent-control', label: 'Agent 管控', icon: SlidersHorizontal },
      { to: '/prompts', label: '提示词管理', icon: FileCode2 },
      { to: '/integrations', label: '集成中心', icon: Plug },
      { to: '/audit', label: '审计日志', icon: ScrollText },
      { to: '/settings', label: '系统设置', icon: Settings },
    ],
  },
]

export default function Sidebar() {
  const workspaceName = useStore((s) => s.workspaces[s.activeWorkspaceId]?.name)
  const org = useStore((s) => s.org)
  const lockWorkspace = useStore((s) => s.lockWorkspace)
  const navigate = useNavigate()
  const me = org.members.find((m) => m.id === org.currentMemberId)

  return (
    <aside className="hidden md:flex fixed top-0 left-0 h-screen w-60 bg-slate-900 flex-col z-40">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-700">
        <div className="w-9 h-9 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <Bot size={20} className="text-white" />
        </div>
        <div>
          <div className="text-white font-bold text-base leading-tight">Agent 业务台</div>
          <div className="text-slate-400 text-xs">智能业务管理系统</div>
        </div>
      </div>

      {/* 唤起 Agent —— 核心入口 */}
      <div className="px-3 pt-4">
        <button
          onClick={() => navigate('/assistant')}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-medium rounded-xl py-2.5 shadow-md shadow-blue-900/30 transition-all"
        >
          <Zap size={16} /> 唤起 Agent
        </button>
      </div>

      {/* Navigation（分组） */}
      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.label}>
            <div className="px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              {group.label}
            </div>
            <div className="space-y-1">
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm'
                        : item.hero
                        ? 'text-blue-300 hover:bg-slate-800 hover:text-blue-200'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon size={17} className={isActive ? 'text-white' : 'text-slate-400'} />
                      <span className="flex-1">{item.label}</span>
                      {item.badge && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isActive ? 'bg-white/20 text-white' : 'bg-blue-500/20 text-blue-300'}`}>
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer：工作区 + 当前成员 + 锁定 */}
      <div className="px-4 py-4 border-t border-slate-700 space-y-3">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <div className="text-slate-300 text-xs">工作区</div>
            <div className="text-white text-sm font-medium truncate">{workspaceName}</div>
          </div>
          <button
            onClick={lockWorkspace}
            title="锁定 / 切换工作区"
            className="flex items-center gap-1 px-2 py-1.5 text-xs text-slate-400 hover:bg-slate-800 hover:text-slate-100 rounded-lg transition-colors"
          >
            <Lock size={14} />
            锁定
          </button>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center flex-shrink-0">
            {(me?.name || '我').slice(0, 1)}
          </div>
          <div className="min-w-0">
            <div className="text-slate-200 text-sm truncate">{me?.name || '我'}</div>
            <div className="text-slate-500 text-xs">当前操作身份</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
