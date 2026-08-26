import { useState } from 'react'
import useStore from '../store/useStore'
import { Bot, Lock, Plus, Users, LogOut, Zap } from 'lucide-react'

export default function WorkspaceGate() {
  const workspaces = useStore((s) => s.workspaces)
  const loggedIn = useStore((s) => s.loggedIn)
  const currentUser = useStore((s) => s.currentUser)
  const login = useStore((s) => s.login)
  const registerAccount = useStore((s) => s.registerAccount)
  const logout = useStore((s) => s.logout)
  const unlockWorkspace = useStore((s) => s.unlockWorkspace)
  const createWorkspace = useStore((s) => s.createWorkspace)

  if (!loggedIn) return <LoginScreen onLogin={login} onRegister={registerAccount} />

  return (
    <WorkspacePicker
      workspaces={workspaces}
      currentUser={currentUser}
      onUnlock={unlockWorkspace}
      onCreate={createWorkspace}
      onLogout={logout}
    />
  )
}

/* ───────────── 登录页 ───────────── */
function LoginScreen({ onLogin, onRegister }) {
  const [mode, setMode] = useState('login') // login | register
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [err, setErr] = useState('')

  function handleLogin() {
    setErr('')
    if (!username.trim() || !password) {
      setErr('请输入账号和密码')
      return
    }
    const ok = onLogin(username.trim(), password)
    if (!ok) setErr('账号或密码错误')
  }

  function handleRegister() {
    setErr('')
    if (!username.trim() || !password) {
      setErr('请输入账号和密码')
      return
    }
    if (password.length < 4) {
      setErr('密码至少 4 位')
      return
    }
    if (password !== confirm) {
      setErr('两次密码不一致')
      return
    }
    onRegister(username.trim(), password)
  }

  function quickExperience() {
    setErr('')
    onLogin('demo', 'demo')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-500 rounded-2xl mb-4 shadow-lg shadow-blue-500/30">
            <Bot size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Agent 智能业务管理系统</h1>
          <p className="text-slate-400 text-sm mt-1.5 flex items-center justify-center gap-1.5">
            <Zap size={13} className="text-blue-400" /> 自然语言驱动的业务管理 Agent
          </p>
        </div>

        <div className="bg-slate-800/70 border border-slate-700 rounded-2xl p-6 backdrop-blur">
          <div className="flex items-center gap-2 mb-5">
            <Lock size={16} className="text-slate-400" />
            <span className="text-slate-200 font-semibold">{mode === 'login' ? '登录' : '注册新账号'}</span>
          </div>

          {err && (
            <div className="mb-4 px-3 py-2 bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-lg">
              {err}
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">账号</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (mode === 'login' ? handleLogin() : handleRegister())}
                placeholder="请输入账号"
                className="w-full px-3 py-2.5 text-sm bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (mode === 'login' ? handleLogin() : handleRegister())}
                placeholder="请输入密码"
                className="w-full px-3 py-2.5 text-sm bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {mode === 'register' && (
              <div>
                <label className="text-xs text-slate-400 mb-1 block">确认密码</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
                  placeholder="再次输入密码"
                  className="w-full px-3 py-2.5 text-sm bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {mode === 'login' ? (
              <button
                onClick={handleLogin}
                className="w-full py-2.5 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
              >
                登录
              </button>
            ) : (
              <button
                onClick={handleRegister}
                className="w-full py-2.5 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
              >
                注册并登录
              </button>
            )}
          </div>

          {mode === 'login' ? (
            <div className="mt-4 flex items-center justify-between text-xs">
              <button onClick={quickExperience} className="text-blue-400 hover:text-blue-300">
                快速体验（demo / demo）
              </button>
              <button onClick={() => { setMode('register'); setErr('') }} className="text-slate-400 hover:text-slate-200">
                注册账号
              </button>
            </div>
          ) : (
            <div className="mt-4 text-right text-xs">
              <button onClick={() => { setMode('login'); setErr('') }} className="text-slate-400 hover:text-slate-200">
                返回登录
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-slate-500 text-xs mt-6">
          所有数据仅存储在当前浏览器本地，不会上传服务器。
        </p>
      </div>
    </div>
  )
}

/* ───────────── 工作区选择 ───────────── */
function WorkspacePicker({ workspaces, currentUser, onUnlock, onCreate, onLogout }) {
  const [pinFor, setPinFor] = useState(null)
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPin, setNewPin] = useState('')

  const list = Object.values(workspaces)

  function handleEnter(ws) {
    if (ws.pin) {
      setPinFor(ws.id)
      setPin('')
      setPinError('')
      return
    }
    onUnlock(ws.id)
  }

  function handlePinSubmit(ws) {
    const ok = onUnlock(ws.id, pin)
    if (!ok) setPinError('密码错误')
  }

  function handleCreate() {
    if (!newName.trim()) return
    onCreate(newName.trim(), newPin)
    setShowNew(false)
    setNewName('')
    setNewPin('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-white">选择工作区</h1>
            <p className="text-slate-400 text-sm mt-1">欢迎，{currentUser} · 数据本地隔离</p>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-800 hover:text-slate-100 rounded-lg transition-colors"
          >
            <LogOut size={13} /> 退出
          </button>
        </div>

        <div className="space-y-3">
          {list.map((ws) => (
            <div
              key={ws.id}
              className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 flex items-center justify-between hover:border-slate-500 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center flex-shrink-0">
                  <Users size={18} className="text-slate-300" />
                </div>
                <div className="min-w-0">
                  <div className="text-white font-medium truncate">{ws.name}</div>
                  <div className="text-slate-400 text-xs">
                    {ws.data.customers.length} 客户 · {ws.data.tasks.length} 任务
                    {ws.pin ? ' · 已加密' : ''}
                  </div>
                </div>
              </div>
              {pinFor === ws.id ? (
                <div className="flex items-center gap-2 relative">
                  <input
                    type="password"
                    autoFocus
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handlePinSubmit(ws)}
                    placeholder="密码"
                    className="w-24 px-2 py-1.5 text-sm bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => handlePinSubmit(ws)}
                    className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg"
                  >
                    进入
                  </button>
                  {pinError && <span className="absolute -bottom-5 left-0 text-red-400 text-xs">{pinError}</span>}
                </div>
              ) : (
                <button
                  onClick={() => handleEnter(ws)}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                >
                  {ws.pin && <Lock size={14} />}
                  进入
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="mt-4">
          {showNew ? (
            <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 space-y-3">
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="工作区名称"
                className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="password"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                placeholder="访问密码（可选）"
                className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleCreate}
                  className="flex-1 px-3 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg"
                >
                  创建
                </button>
                <button
                  onClick={() => setShowNew(false)}
                  className="px-3 py-2 text-sm bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg"
                >
                  取消
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowNew(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm border border-dashed border-slate-600 text-slate-300 rounded-xl hover:border-slate-400 hover:text-white transition-colors"
            >
              <Plus size={16} />
              新建工作区
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
