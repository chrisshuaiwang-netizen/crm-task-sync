import { useState, useRef, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Bot,
  Send,
  Paperclip,
  Check,
  X,
  Sparkles,
  User,
  History,
  PanelRight,
  AlertTriangle,
} from 'lucide-react'
import useStore from '../store/useStore'
import { analyzeInput, executePlan, executeAbility } from '../utils/agent'
import { PRIORITY_BADGE, CUSTOMER_STATUS_COLORS, REQUIREMENT_STATUS_COLORS, TASK_STATUSES, STATUS_CONFIG } from '../constants'

const QUICK = [
  '把今天会议里的待办整理成任务',
  '新增客户：星河保险，行业金融',
  '华夏银行有个智能质检的需求，优先级高',
  '列出本周逾期的任务',
  '分析任务：优化提示词提升转化率',
  '给我排一下任务优先级',
]

const KIND_LABEL = { task: '任务', requirement: '需求', customer: '客户', meeting: '会议纪要' }
const KIND_COLOR = {
  task: 'bg-blue-100 text-blue-700',
  requirement: 'bg-violet-100 text-violet-700',
  customer: 'bg-emerald-100 text-emerald-700',
  meeting: 'bg-pink-100 text-pink-700',
}

export default function Assistant() {
  const customers = useStore((s) => s.customers)
  const llmConfig = useStore((s) => s.llmConfig)
  const agentConfig = useStore((s) => s.agentConfig)
  const [searchParams, setSearchParams] = useSearchParams()
  const didPrefill = useRef(false)

  const [messages, setMessages] = useState([
    { id: 'hi', role: 'agent', text: '你好，我是业务管理助手。用自然语言告诉我你要做什么——建任务、录需求、加客户、记会议纪要，或查询进度。写操作我会先给你预览，确认后再执行；也可以让我分析任务、拆解子任务、排优先级或总结。' },
  ])
  const [history, setHistory] = useState([]) // 多轮上下文 [{role, content}]
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [pending, setPending] = useState(null) // { summary, items, usedFallback, error }
  const chatRef = useRef(null)
  const historyRef = useRef([])

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, pending])

  // 从全局命令栏 / 首页带入的预填指令，进入即自动分析
  useEffect(() => {
    if (didPrefill.current) return
    const q = searchParams.get('q')
    if (q) {
      didPrefill.current = true
      handleSend(decodeURIComponent(q))
      setSearchParams({}, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSend(text) {
    const clean = (text || '').trim()
    if (!clean || loading) return
    setInput('')
    const hist = historyRef.current
    setMessages((m) => [...m, { id: `u-${Date.now()}`, role: 'user', text: clean }])
    setLoading(true)
    const plan = await analyzeInput(clean, { llmConfig, customers, history: hist })
    setLoading(false)

    const newHist = [...hist, { role: 'user', content: clean }, { role: 'assistant', content: plan.summary || '' }]
    historyRef.current = newHist

    // 能力 / 查询分支
    if (plan.action && plan.action.type) {
      const result = await executeAbility(plan.action, { store: useStore.getState() })
      const fb = plan.usedFallback ? '（未配置 Key，已用本地解析）' : ''
      setMessages((m) => [...m, { id: `a-${Date.now()}`, role: 'agent', text: `${plan.summary}${fb}`, result }])
      setHistory(newHist)
      return
    }

    if (plan.items.length > 0) {
      setPending(plan)
      setMessages((m) => [
        ...m,
        {
          id: `a-${Date.now()}`,
          role: 'agent',
          text: `${plan.summary}${plan.usedFallback ? '（未配置 Key，已用本地解析，建议到设置页填写模型 Key 提升准确度）' : ''}。以下是执行预览，请确认：`,
          planId: `plan-${Date.now()}`,
        },
      ])
    } else {
      setMessages((m) => [...m, { id: `a-${Date.now()}`, role: 'agent', text: plan.summary || '已收到，暂未识别到可执行的创建操作。' }])
    }
    setHistory(newHist)
  }

  function confirmPlan() {
    if (!pending) return
    const results = executePlan(pending.items, { customers, store: useStore.getState() })
    setMessages((m) => [...m, { id: `e-${Date.now()}`, role: 'agent', text: `已执行完成：\n${results.map((r) => '· ' + r).join('\n')}` }])
    setPending(null)
  }

  function dismissPlan() {
    setMessages((m) => [...m, { id: `c-${Date.now()}`, role: 'agent', text: '已取消本次执行。' }])
    setPending(null)
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* 左栏：会话历史 */}
      <div className="hidden lg:flex w-56 flex-col border-r border-slate-200 bg-white">
        <div className="px-4 py-4 border-b border-slate-100 flex items-center gap-2 text-slate-700">
          <History size={16} />
          <span className="text-sm font-semibold">会话历史</span>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-1 text-sm text-slate-500">
          <div className="px-3 py-2 rounded-lg bg-blue-50 text-blue-700">当前会话</div>
          <div className="px-3 py-2 rounded-lg hover:bg-slate-50">会议纪要整理（示例）</div>
          <div className="px-3 py-2 rounded-lg hover:bg-slate-50">本周进度查询</div>
        </div>
        <div className="p-3 border-t border-slate-100">
          <button onClick={() => { setMessages([messages[0]]); setPending(null) }} className="w-full text-xs text-slate-500 hover:text-slate-700 border border-slate-200 rounded-lg py-2">
            + 新建对话
          </button>
        </div>
      </div>

      {/* 中栏：对话 */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
        <div className="px-5 py-3 border-b border-slate-200 bg-white flex items-center gap-2">
          <Bot size={18} className="text-blue-600" />
          <span className="font-semibold text-slate-800">智能助手 · 对话工作台</span>
          {agentConfig?.confirmWrite && (
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <AlertTriangle size={12} /> 写操作需确认
            </span>
          )}
        </div>

        <div ref={chatRef} className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
          {messages.map((m) => (
            <div key={m.id} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${m.role === 'user' ? 'bg-slate-700 text-white' : 'bg-blue-600 text-white'}`}>
                {m.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white text-slate-700 border border-slate-200'}`}>
                {m.text}
                {m.result && <ResultView result={m.result} />}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center"><Bot size={16} /></div>
              <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-400 flex items-center gap-2">
                <Sparkles size={14} className="animate-pulse" /> 思考中…
              </div>
            </div>
          )}
        </div>

        {/* 快捷指令 + 输入 */}
        <div className="border-t border-slate-200 bg-white px-4 py-3">
          <div className="flex flex-wrap gap-2 mb-2">
            {QUICK.map((q) => (
              <button key={q} onClick={() => handleSend(q)} className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
                {q}
              </button>
            ))}
          </div>
          <div className="flex items-end gap-2">
            <button className="p-2.5 rounded-lg text-slate-400 hover:bg-slate-100" title="上传文件（占位）">
              <Paperclip size={18} />
            </button>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(input) } }}
              rows={1}
              placeholder="输入指令，例如：华夏银行要加一个智能质检需求，优先级高…"
              className="flex-1 resize-none px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 max-h-32"
            />
            <button
              onClick={() => handleSend(input)}
              disabled={loading || !input.trim()}
              className="p-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 transition-colors"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* 右栏：执行详情 */}
      <div className="hidden xl:flex w-80 flex-col border-l border-slate-200 bg-white">
        <div className="px-4 py-4 border-b border-slate-100 flex items-center gap-2 text-slate-700">
          <PanelRight size={16} />
          <span className="text-sm font-semibold">执行详情</span>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {!pending && <div className="text-sm text-slate-400 mt-8 text-center">执行计划预览将在此展示。<br />确认后才会写入数据。</div>}
          {pending && (
            <div className="space-y-3">
              <div className="text-sm font-medium text-slate-700">{pending.summary}</div>
              {pending.error && <div className="text-xs text-amber-600">⚠️ 模型调用失败，已用本地解析：{pending.error}</div>}
              {pending.items.map((it, i) => (
                <div key={i} className="border border-slate-200 rounded-xl p-3 text-sm">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`text-[11px] px-1.5 py-0.5 rounded ${KIND_COLOR[it.kind]}`}>{KIND_LABEL[it.kind]}</span>
                    <span className="font-medium text-slate-800 truncate">{it.title || it.name}</span>
                  </div>
                  <div className="text-xs text-slate-500 line-clamp-2">{it.content || it.notes}</div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {it.priority && <span className={`text-[11px] px-1.5 py-0.5 rounded ${PRIORITY_BADGE[it.priority]}`}>{it.priority}</span>}
                    {it.status && (
                      <span className={`text-[11px] px-1.5 py-0.5 rounded ${it.kind === 'requirement' ? REQUIREMENT_STATUS_COLORS[it.status] : it.kind === 'customer' ? CUSTOMER_STATUS_COLORS[it.status] : STATUS_CONFIG[it.status]?.badge}`}>
                        {it.status}
                      </span>
                    )}
                    {it.customerName && <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">{it.customerName}</span>}
                    {it.deadline && <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">截止 {it.deadline}</span>}
                  </div>
                </div>
              ))}
              <div className="flex gap-2 pt-1">
                <button onClick={confirmPlan} className="flex-1 flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 rounded-lg transition-colors">
                  <Check size={15} /> 确认执行
                </button>
                <button onClick={dismissPlan} className="flex items-center justify-center gap-1 px-3 text-slate-500 hover:bg-slate-100 text-sm py-2 rounded-lg transition-colors">
                  <X size={15} /> 取消
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/** 能力 / 查询结果的富展示 */
function ResultView({ result }) {
  const addTask = useStore((s) => s.addTask)
  if (!result) return null

  if (result.kind === 'text') {
    return <div className="mt-2 text-sm text-slate-600 whitespace-pre-wrap">{result.text}</div>
  }

  if (result.kind === 'task_analysis' && result.data) {
    const d = result.data
    return (
      <div className="mt-2 space-y-1.5 text-sm">
        <div className="flex flex-wrap gap-1.5">
          {(d.tags || []).map((t, i) => (
            <span key={i} className="text-[11px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{t}</span>
          ))}
          <span className={`text-[11px] px-1.5 py-0.5 rounded ${PRIORITY_BADGE[d.priority] || ''}`}>{d.priority}</span>
          <span className="text-[11px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600">{d.taskType === 'prompt' ? '提示词类' : '功能类'}</span>
        </div>
        <div className="text-slate-600">{d.summary}</div>
      </div>
    )
  }

  if (result.kind === 'subtasks') {
    return (
      <div className="mt-2 space-y-2">
        {(result.subtasks || []).map((s, i) => (
          <div key={i} className="border border-slate-200 rounded-lg p-2 text-sm">
            <div className="font-medium text-slate-700">{s.title}</div>
            <div className="text-xs text-slate-500">{s.desc} · 预估 {s.hours}h</div>
            <button
              onClick={() => addTask({ title: s.title, content: s.desc, source: '其他', priority: '中' })}
              className="mt-1 text-[11px] text-blue-600 hover:underline"
            >
              + 创建为任务
            </button>
          </div>
        ))}
      </div>
    )
  }

  if (result.kind === 'priority') {
    return (
      <div className="mt-2 space-y-1.5 text-sm">
        <ol className="list-decimal list-inside space-y-1">
          {(result.sorted || []).map((t, i) => (
            <li key={t.id || i} className="text-slate-700">
              <span className="text-slate-400 mr-1">[{t.priority}]</span>
              {t.title}
            </li>
          ))}
        </ol>
        <div className="text-xs text-slate-500 whitespace-pre-wrap bg-slate-50 rounded p-2">{result.reasoning}</div>
      </div>
    )
  }

  if (result.rows) {
    const cols = Object.keys(result.rows[0] || {})
    return (
      <div className="mt-2 overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="text-slate-400 border-b border-slate-200">
              {cols.map((c) => (
                <th key={c} className="text-left py-1 pr-3 font-medium">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {result.rows.map((r, i) => (
              <tr key={i} className="border-b border-slate-100">
                {cols.map((c) => (
                  <td key={c} className="py-1 pr-3 text-slate-600">{r[c]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return null
}
