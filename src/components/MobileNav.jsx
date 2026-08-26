import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Bell, Bot, ListChecks, Settings, Bot as Logo } from 'lucide-react'
import useStore from '../store/useStore'
import ReminderBell from './ReminderBell'

const tabs = [
  { to: '/', label: '首页', icon: LayoutDashboard, end: true },
  { to: '/messages', label: '消息', icon: Bell },
  { to: '/assistant', label: '助手', icon: Bot },
  { to: '/tasks', label: '工作台', icon: ListChecks },
  { to: '/settings', label: '我的', icon: Settings },
]

export default function MobileNav() {
  const workspaceName = useStore((s) => s.workspaces[s.activeWorkspaceId]?.name)

  return (
    <>
      {/* 顶部栏（仅移动端） */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-slate-900 flex items-center justify-between px-4 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <Logo size={18} className="text-white" />
          </div>
          <div>
            <div className="text-white font-bold text-sm leading-none">Agent 业务台</div>
            <div className="text-slate-400 text-[11px] mt-0.5 truncate max-w-[140px]">{workspaceName}</div>
          </div>
        </div>
        <ReminderBell />
      </header>

      {/* 底部 Tab 栏（仅移动端） */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200 flex items-stretch z-40 pb-[env(safe-area-inset-bottom)]">
        {tabs.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center gap-0.5 text-[11px] transition-colors ${
                isActive ? 'text-blue-600' : 'text-slate-400'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={20} className={isActive ? 'text-blue-600' : 'text-slate-400'} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </>
  )
}
