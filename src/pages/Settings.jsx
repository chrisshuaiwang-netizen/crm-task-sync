import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, KeyRound, CheckCircle2, AlertTriangle, Loader2, ExternalLink, Bell, UserCog } from 'lucide-react'
import useStore from '../store/useStore'
import { LLM_PROVIDERS } from '../constants'
import { testConnection } from '../utils/llm'
import { requestNotificationPermission } from '../utils/reminders'

export default function Settings() {
  const navigate = useNavigate()
  const llmConfig = useStore((s) => s.llmConfig)
  const updateLlmConfig = useStore((s) => s.updateLlmConfig)
  const prefs = useStore((s) => s.prefs)
  const updatePrefs = useStore((s) => s.updatePrefs)
  const workspaceName = useStore((s) => s.workspaces[s.activeWorkspaceId]?.name)
  const activeWorkspaceId = useStore((s) => s.activeWorkspaceId)
  const renameWorkspace = useStore((s) => s.renameWorkspace)
  const updateWorkspacePin = useStore((s) => s.updateWorkspacePin)

  const [provider, setProvider] = useState(llmConfig.provider)
  const [apiKey, setApiKey] = useState(llmConfig.apiKey)
  const [model, setModel] = useState(llmConfig.model)
  const [testing, setTesting] = useState(false)
  const [testMsg, setTestMsg] = useState(null)
  const [saved, setSaved] = useState(false)
  const [wsName, setWsName] = useState(workspaceName || '')
  const [wsPin, setWsPin] = useState('')
  const [wsSaved, setWsSaved] = useState(false)

  const notificationsEnabled = prefs?.notificationsEnabled

  async function handleToggleNotify() {
    if (!notificationsEnabled) {
      const res = await requestNotificationPermission()
      if (res !== 'granted') return
    }
    updatePrefs({ notificationsEnabled: !notificationsEnabled })
  }

  function handleSaveWorkspace() {
    if (wsName.trim()) renameWorkspace(activeWorkspaceId, wsName.trim())
    updateWorkspacePin(activeWorkspaceId, wsPin)
    setWsSaved(true)
    setTimeout(() => setWsSaved(false), 2500)
  }

  const current = LLM_PROVIDERS.find((p) => p.id === provider) || LLM_PROVIDERS[0]

  function handleProviderChange(id) {
    const p = LLM_PROVIDERS.find((x) => x.id === id)
    setProvider(id)
    setModel(p.defaultModel)
    setTestMsg(null)
  }

  function handleSave() {
    updateLlmConfig({ provider, apiKey: apiKey.trim(), model })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  async function handleTest() {
    if (!apiKey.trim()) {
      setTestMsg({ ok: false, msg: '请先填写 API Key' })
      return
    }
    setTesting(true)
    setTestMsg(null)
    try {
      const reply = await testConnection({ providerId: provider, apiKey: apiKey.trim(), model })
      setTestMsg({ ok: true, msg: `连接成功，模型回复：${reply.slice(0, 20)}` })
    } catch (e) {
      setTestMsg({ ok: false, msg: e.message })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">设置</h1>
          <p className="text-slate-500 text-sm mt-0.5">配置 AI 模型，用于语义理解与自动建任务</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
        <div className="flex items-center gap-2 text-slate-700">
          <KeyRound size={17} className="text-blue-500" />
          <h2 className="font-semibold text-base">模型接入</h2>
        </div>

        {/* Provider */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">模型商</label>
          <div className="grid grid-cols-3 gap-2">
            {LLM_PROVIDERS.map((p) => (
              <button
                key={p.id}
                onClick={() => handleProviderChange(p.id)}
                className={`px-3 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                  provider === p.id
                    ? 'bg-blue-50 border-blue-400 text-blue-700'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {/* API Key */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">API Key</label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => { setApiKey(e.target.value); setTestMsg(null) }}
            placeholder={current.placeholder}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-slate-400 mt-1">
            Key 仅保存在你的浏览器本地（LocalStorage），不会上传到任何服务器。
            <a
              href={current.doc}
              target="_blank"
              rel="noreferrer"
              className="text-blue-500 hover:underline ml-1 inline-flex items-center gap-0.5"
            >
              获取 Key <ExternalLink size={11} />
            </a>
          </p>
        </div>

        {/* Model */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">模型</label>
          <select
            value={model}
            onChange={(e) => { setModel(e.target.value); setTestMsg(null) }}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            {current.models.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        {/* Test */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleTest}
            disabled={testing}
            className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-sm font-medium text-slate-700 transition-colors disabled:opacity-50"
          >
            {testing ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
            测试连接
          </button>
          {testMsg && (
            <span className={`text-xs flex items-center gap-1 ${testMsg.ok ? 'text-green-600' : 'text-red-500'}`}>
              {testMsg.ok ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
              {testMsg.msg}
            </span>
          )}
        </div>

        {testMsg?.ok === false && testMsg.msg.includes('跨域') && (
          <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 leading-relaxed">
            提示：部分模型商的 API 不允许浏览器直接跨域调用。若测试失败且提示跨域，可改用「serverless 代理」方式（密钥放服务端），或换用支持 CORS 的模型商。
          </div>
        )}

        {/* Save */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
          {saved && (
            <span className="text-xs text-green-600 flex items-center gap-1">
              <CheckCircle2 size={13} /> 已保存
            </span>
          )}
          <button
            onClick={handleSave}
            className="px-5 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            保存设置
          </button>
        </div>
      </div>

      {/* 通知 */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mt-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-700">
            <Bell size={17} className="text-blue-500" />
            <h2 className="font-semibold text-base">桌面通知</h2>
          </div>
          <button
            onClick={handleToggleNotify}
            className={`relative w-11 h-6 rounded-full transition-colors ${notificationsEnabled ? 'bg-blue-600' : 'bg-slate-300'}`}
          >
            <span className={`absolute top-0.5 ${notificationsEnabled ? 'left-5' : 'left-0.5'} w-5 h-5 bg-white rounded-full transition-all`} />
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-2">
          开启后，临近到期（逾期 / 今天）的任务会以系统通知提醒你。需要浏览器授权通知权限。
        </p>
      </div>

      {/* 工作区 */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mt-5 space-y-4">
        <div className="flex items-center gap-2 text-slate-700">
          <UserCog size={17} className="text-blue-500" />
          <h2 className="font-semibold text-base">工作区</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">工作区名称</label>
            <input
              value={wsName}
              onChange={(e) => setWsName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">访问密码（留空则不设）</label>
            <input
              type="password"
              value={wsPin}
              onChange={(e) => setWsPin(e.target.value)}
              placeholder="设置后进入需输入"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3">
          {wsSaved && (
            <span className="text-xs text-green-600 flex items-center gap-1">
              <CheckCircle2 size={13} /> 已保存
            </span>
          )}
          <button
            onClick={handleSaveWorkspace}
            className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            保存工作区
          </button>
        </div>
        <button
          onClick={() => navigate('/team')}
          className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          <UserCog size={12} /> 管理团队成员与权限
        </button>
      </div>

      <div className="mt-4 text-xs text-slate-400 leading-relaxed">
        说明：当前为「自填 Key 直连」方案，请求由你的浏览器直接发往模型商。数据模型与调用接口已抽象，后续可无缝切换为 serverless 代理或内置默认模型。多工作区数据相互隔离，仅存储在当前浏览器本地。
      </div>
    </div>
  )
}
