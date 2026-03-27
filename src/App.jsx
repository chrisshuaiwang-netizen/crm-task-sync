import { Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Customers from './pages/Customers'
import Inbox from './pages/Inbox'
import Schedule from './pages/Schedule'

export default function App() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="ml-60 flex-1 min-w-0">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/inbox" element={<Inbox />} />
          <Route path="/schedule" element={<Schedule />} />
        </Routes>
      </main>
    </div>
  )
}
