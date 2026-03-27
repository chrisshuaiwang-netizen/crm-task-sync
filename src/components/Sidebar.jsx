import { NavLink } from 'react-router-dom'
import { Briefcase, LayoutDashboard, Users, Inbox, Calendar } from 'lucide-react'

const navItems = [
  { to: '/', label: '总览', icon: LayoutDashboard, end: true },
  { to: '/customers', label: '客户', icon: Users },
  { to: '/inbox', label: '收件箱', icon: Inbox },
  { to: '/schedule', label: '工作计划', icon: Calendar },
]

export default function Sidebar() {
  return (
    <aside className="fixed top-0 left-0 h-screen w-60 bg-slate-900 flex flex-col z-40">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-700">
        <div className="w-9 h-9 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <Briefcase size={20} className="text-white" />
        </div>
        <div>
          <div className="text-white font-bold text-base leading-tight">CRM-Task</div>
          <div className="text-slate-400 text-xs">产品经理工作台</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={18} className={isActive ? 'text-white' : 'text-slate-400'} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-slate-700">
        <div className="text-slate-500 text-xs">版本 v1.0</div>
        <div className="text-slate-600 text-xs mt-0.5">CRM-Task Sync</div>
      </div>
    </aside>
  )
}
