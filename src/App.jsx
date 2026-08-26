import { Routes, Route } from 'react-router-dom'
import useStore from './store/useStore'
import Sidebar from './components/Sidebar'
import MobileNav from './components/MobileNav'
import TopBar from './components/TopBar'
import WorkspaceGate from './components/WorkspaceGate'
import Dashboard from './pages/Dashboard'
import Assistant from './pages/Assistant'
import Customers from './pages/Customers'
import Deals from './pages/Deals'
import Requirements from './pages/Requirements'
import Tasks from './pages/Tasks'
import Projects from './pages/Projects'
import Meetings from './pages/Meetings'
import Reports from './pages/Reports'
import Knowledge from './pages/Knowledge'
import Integrations from './pages/Integrations'
import DataReport from './pages/DataReport'
import Messages from './pages/Messages'
import Team from './pages/Team'
import Permissions from './pages/Permissions'
import AgentControl from './pages/AgentControl'
import Audit from './pages/Audit'
import Settings from './pages/Settings'
import PromptManage from './pages/PromptManage'

export default function App() {
  const loggedIn = useStore((s) => s.loggedIn)
  const unlocked = useStore((s) => s.unlocked)

  if (!loggedIn || !unlocked) return <WorkspaceGate />

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="ml-0 md:ml-60 flex-1 min-w-0 pt-14 md:pt-0 pb-16 md:pb-0">
        <TopBar />
        <Routes>
          {/* 1. 首页仪表盘 */}
          <Route path="/" element={<Dashboard />} />
          {/* 2. 智能助手 */}
          <Route path="/assistant" element={<Assistant />} />
          {/* 3. 客户管理 */}
          <Route path="/customers" element={<Customers />} />
          <Route path="/deals" element={<Deals />} />
          {/* 4. 需求任务管理 */}
          <Route path="/requirements" element={<Requirements />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/projects" element={<Projects />} />
          {/* 5. 文档总结中心 */}
          <Route path="/meetings" element={<Meetings />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/knowledge" element={<Knowledge />} />
          {/* 6. 数据报表中心 */}
          <Route path="/data-report" element={<DataReport />} />
          {/* 消息中心 */}
          <Route path="/messages" element={<Messages />} />
          {/* 7. 系统管理 */}
          <Route path="/team" element={<Team />} />
          <Route path="/permissions" element={<Permissions />} />
          <Route path="/agent-control" element={<AgentControl />} />
          <Route path="/prompts" element={<PromptManage />} />
          <Route path="/integrations" element={<Integrations />} />
          <Route path="/audit" element={<Audit />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
      <MobileNav />
    </div>
  )
}
