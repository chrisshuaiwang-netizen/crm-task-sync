import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Sparkles,
  Send,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Settings,
  Plus,
} from 'lucide-react'
import useStore from '../store/useStore'
import { analyzeInput, executePlan } from '../utils/agent'

const KIND_LABEL = { task: '任务', requirement: '需求', customer: '客户', meeting: '会议纪要' }
const KIND_COLOR = {
  task: 'bg-blue-100 text-blue-700',
  requirement: 'bg-violet-100 text-violet-700',
  customer: 'bg-orange-100 text-orange-700',
  meeting: 'bg-pink-100 text-pink-700',
}

export default function AgentAssistant() {
  const navigate = useNavigate()
  const { llmConfig, customers, agentConfig } = useStore()

  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null) // { summary, items, usedFallback }
  const [toast, setToast] = useState(null)

  const hasKey = llmConfig?.apiKey && llmConfig.apiKey.trim()

  function showToast(message, type = 'success') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  function resolveCustomer(name) {
    if (!name) return null
    return customers.find((c) => c.name.includes(name) || name.includes(c.name)) || null
  }

  async function handleAnalyze() {
    if (!input.trim() || loading) return
    setLoading(true)
    setResult(null)
    const res = await analyzeInput(input, { llmConfig, customers })
    setLoading(false)
    setResult(res)
    if (res.error) showToast(`模型调用失败，已用本地解析：${res.error}`, 'info')
  }

  function handleCreate() {
    if (!result?.items?.length) return
    const created = executePlan(result.items, { customers, store: useStore.getState() })
    showToast(`已创建 ${created.length} 项（${created.join('、')}）`)
    setResult(null)
    setInput('')
  }

  function handleClear() {
    setResult(null)
    setInput('')
  }

  return (
    <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-sm p-5 text-white">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <Sparkles size={17} />
          </div>
          <div>
            <h2 className="font-semibold text-base leading-tight">智能助手</h2>
            <p className="text-blue-100 text-xs">输入一段话，自动理解并创建任务 / 需求 / 客户</p>
          </div>
        </div>
        {!hasKey && (
          <button
            onClick={() => navigate('/settings')}
            className="flex items-center gap-1 bg-white/20 hover:bg-white/30 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors"
          >
            <Settings size={13} />
            配置模型
          </button>
        )}
      </div>

      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="例如：今天和华夏银行开了会，确定下周出 POC 方案，截止周五；云帆零售的营销文案需求评审排到下周二，优先级高。"
        rows={3}
        className="w-full px-3.5 py-2.5 text-sm text-slate-800 rounded-xl border-0 focus:outline-none focus:ring-2 focus:ring-white/60 resize-none placeholder:text-slate-400"
      />

      <div className="flex items-center justify-between mt-3">
        <span className="text-xs text-blue-100">
          {hasKey ? `模型：${llmConfig.provider} / ${llmConfig.model}` : '未配置模型 · 本地简易解析'}
        </span>
        <div className="flex items-center gap-2">
          {result && (
            <button
              onClick={handleClear}
              className="px-3 py-1.5 text-xs bg-white/15 hover:bg-white/25 rounded-lg font-medium transition-colors"
            >
              清空
            </button>
          )}
          <button
            onClick={handleAnalyze}
            disabled={!input.trim() || loading}
            className="flex items-center gap-1.5 bg-white text-blue-700 hover:bg-blue-50 disabled:bg-white/50 disabled:text-blue-300 px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors"
          >
            {loading ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                分析中…
              </>
            ) : (
              <>
                <Send size={15} />
                分析
              </>
            )}
          </button>
        </div>
      </div>

      {/* Preview */}
      {result && (
        <div className="mt-4 bg-white rounded-xl p-3 space-y-2 max-h-80 overflow-y-auto">
          {result.usedFallback && (
            <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
              <AlertTriangle size={13} />
              {hasKey
                ? '模型调用失败，已用本地简易解析（按标点拆分）。'
                : '未配置模型，已用本地简易解析。配置真模型可获语义理解能力。'}
            </div>
          )}

          {result.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-slate-400">
              <CheckCircle2 size={26} className="mb-1.5 text-slate-300" />
              <p className="text-xs">未识别到可创建项，换种说法试试？</p>
            </div>
          ) : (
            <>
              <div className="text-xs text-slate-500 px-1">{result.summary}</div>
              {result.items.map((t, i) => {
                const cust = resolveCustomer(t.customerName)
                return (
                  <div key={i} className="border border-slate-100 rounded-lg p-2.5">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${KIND_COLOR[t.kind] || 'bg-slate-100 text-slate-600'}`}>
                        {KIND_LABEL[t.kind] || t.kind}
                      </span>
                      <span className="text-sm font-medium text-slate-800 leading-tight">{t.title || t.name}</span>
                    </div>
                    {t.content && <p className="text-xs text-slate-500 leading-snug line-clamp-2">{t.content}</p>}
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {t.priority && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700">{t.priority}优先级</span>
                      )}
                      {cust && <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">{cust.name}</span>}
                    </div>
                  </div>
                )
              })}
              {agentConfig?.confirmWrite !== false && (
                <p className="text-[11px] text-slate-400 px-1">确认执行型：预览无误后点击下方按钮才会写入。</p>
              )}
              <button
                onClick={handleCreate}
                className="w-full flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-semibold transition-colors"
              >
                <Plus size={15} />
                创建 {result.items.length} 项
              </button>
            </>
          )}
        </div>
      )}

      {toast && (
        <div
          className={`mt-3 fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${
            toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-slate-800 text-white'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          {toast.message}
        </div>
      )}
    </div>
  )
}
