import { useState, useEffect, useRef } from 'react'
import { Sparkles, Send, Check, Pause, FileText, ExternalLink, X, Loader2, Bot, User, Eye } from 'lucide-react'
import useStore from '../store/useStore'
import { getText } from '../utils/fileStore'
import { TEXT_PREVIEW_EXT, DIFFICULTY_COLORS, FEASIBILITY_COLORS } from '../constants'
import {
  analyzeRequirement, chatFollowup, generatePRD, generatePrototypeHtml, publishToIntegration,
} from '../utils/requirementAnalysis'

export default function RequirementAnalyzer({ requirement, onClose }) {
  const store = useStore()
  const { integrations, knowledgeBase, files, llmConfig, updateRequirement, pushMessage, pushAudit } = store
  const [step, setStep] = useState('analyzing') // analyzing | chat | result
  const [analysis, setAnalysis] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [prd, setPrd] = useState('')
  const [prototypeHtml, setPrototypeHtml] = useState('')
  const [tab, setTab] = useState('eval')
  const [publishId, setPublishId] = useState('')
  const [publishMsg, setPublishMsg] = useState(null)
  const scrollRef = useRef(null)

  // 打开即自动分析
  useEffect(() => {
    let alive = true
    ;(async () => {
      setLoading(true)
      const fileTexts = await loadFileTexts(requirement, files)
      const kbCtx = pickKnowledge(requirement, knowledgeBase)
      const a = await analyzeRequirement({ requirement, filesText: fileTexts, knowledge: kbCtx, llmConfig })
      if (!alive) return
      setAnalysis(a)
      setMessages([
        { role: 'assistant', content: `已完成初步评估：可行性【${a.feasible}】、难度【${a.difficulty}】、预计【${a.totalDays}】人天。\n${a.summary}\n\n你可以继续追问（如「风险点怎么解」「能否压缩到 2 周」），或点击下方按钮决策是否推进。` },
      ])
      setStep('chat')
      setLoading(false)
    })()
    return () => { alive = false }
    // 仅在切换需求时自动分析一次；files/knowledgeBase/llmConfig 通过闭包最新值读取
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requirement.id])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  async function send() {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')
    const next = [...messages, { role: 'user', content: userMsg }]
    setMessages(next)
    setLoading(true)
    const fileTexts = await loadFileTexts(requirement, files)
    const kbCtx = pickKnowledge(requirement, knowledgeBase)
    const reply = await chatFollowup({
      requirement, analysis, history: messages, userMsg, filesText: fileTexts, knowledge: kbCtx, llmConfig,
    })
    setMessages([...next, { role: 'assistant', content: reply }])
    setLoading(false)
  }

  async function decide(go) {
    if (go) {
      setStep('result')
      setTab('eval')
      setLoading(true)
      const kbCtx = pickKnowledge(requirement, knowledgeBase)
      const [p, h] = await Promise.all([
        generatePRD({ requirement, analysis, knowledge: kbCtx, llmConfig }),
        Promise.resolve(generatePrototypeHtml({ requirement, analysis })),
      ])
      setPrd(p)
      setPrototypeHtml(h)
      updateRequirement(requirement.id, { analysis, prd: p, prototypeHtml: h, status: requirement.status === '待评审' ? '设计中' : requirement.status })
      pushAudit('需求分析', `需求 ${requirement.title}`, '已生成需求文档与原型')
      pushMessage({ type: '进度', level: 'P2', title: '需求已分析并生成原型', body: requirement.title, link: '/requirements' })
      setLoading(false)
    } else {
      updateRequirement(requirement.id, { analysis })
      pushAudit('需求暂搁', `需求 ${requirement.title}`, '用户选择暂搁')
      onClose()
    }
  }

  async function publish() {
    const it = integrations.find((i) => i.id === publishId)
    if (!it) return
    setPublishMsg({ loading: true })
    const res = await publishToIntegration(it, {
      requirement: { id: requirement.id, title: requirement.title, content: requirement.content, analysis },
      prd,
      prototypeHtml,
    })
    setPublishMsg({ loading: false, ...res })
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-2 md:p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-4xl h-[92vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* 头部 */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center flex-shrink-0">
            <Sparkles size={18} className="text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-bold text-slate-800 truncate">需求分析器 · {requirement.title}</div>
            <div className="text-xs text-slate-400">{analysis?.usedFallback ? '本地启发式评估（未配置模型 Key）' : '基于大模型评估'}</div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400"><X size={18} /></button>
        </div>

        {step !== 'result' ? (
          <>
            {/* 对话区 */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
              {messages.map((m, i) => (
                <div key={i} className={`flex gap-2.5 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${m.role === 'user' ? 'bg-slate-200 text-slate-600' : 'bg-blue-100 text-blue-600'}`}>
                    {m.role === 'user' ? <User size={15} /> : <Bot size={15} />}
                  </div>
                  <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap leading-relaxed ${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-700'}`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center"><Bot size={15} /></div>
                  <div className="bg-white border border-slate-200 rounded-2xl px-3.5 py-2.5 text-sm text-slate-400 flex items-center gap-2"><Loader2 size={14} className="animate-spin" />思考中…</div>
                </div>
              )}
            </div>

            {/* 评估摘要卡 */}
            {analysis && (
              <div className="px-4 py-3 border-t border-slate-100 bg-white">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className={`px-2 py-0.5 rounded ${FEASIBILITY_COLORS[analysis.feasible] || 'bg-slate-100 text-slate-600'}`}>可行性 {analysis.feasible}</span>
                  <span className={`px-2 py-0.5 rounded ${DIFFICULTY_COLORS[analysis.difficulty] || 'bg-slate-100 text-slate-600'}`}>难度 {analysis.difficulty}</span>
                  <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">约 {analysis.totalDays} 人天</span>
                  {(analysis.risks || []).slice(0, 1).map((r, i) => <span key={i} className="text-slate-400 truncate max-w-xs">⚠ {r}</span>)}
                </div>
              </div>
            )}

            {/* 输入 + 决策 */}
            <div className="p-3 border-t border-slate-100 bg-white">
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && send()}
                  placeholder="继续追问，或说明范围/约束让 Agent 重新评估…"
                  className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button onClick={send} disabled={loading} className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"><Send size={16} /></button>
              </div>
              <div className="flex gap-2 mt-2">
                <button onClick={() => decide(true)} disabled={loading} className="flex-1 flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50"><Check size={15} /> 继续推进（生成文档+原型）</button>
                <button onClick={() => decide(false)} disabled={loading} className="flex items-center justify-center gap-1.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 py-2 rounded-lg text-sm disabled:opacity-50"><Pause size={15} /> 暂搁</button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* 结果：标签页 */}
            <div className="flex items-center gap-1 px-4 pt-3 border-b border-slate-100 text-sm">
              {[['eval', '评估'], ['prd', '需求文档'], ['proto', '原型预览'], ['publish', '发布到画板']].map(([k, label]) => (
                <button key={k} onClick={() => setTab(k)} className={`px-3 py-2 rounded-t-lg ${tab === k ? 'bg-slate-100 text-blue-600 font-medium' : 'text-slate-500 hover:text-slate-700'}`}>{label}</button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
              {loading && <div className="flex items-center gap-2 text-slate-400 text-sm"><Loader2 size={14} className="animate-spin" />正在生成…</div>}

              {!loading && tab === 'eval' && analysis && (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <span className={`px-2.5 py-1 rounded text-sm ${FEASIBILITY_COLORS[analysis.feasible]}`}>可行性：{analysis.feasible}</span>
                    <span className={`px-2.5 py-1 rounded text-sm ${DIFFICULTY_COLORS[analysis.difficulty]}`}>难度：{analysis.difficulty}</span>
                    <span className="px-2.5 py-1 rounded text-sm bg-indigo-100 text-indigo-700">预计 {analysis.totalDays} 人天</span>
                  </div>
                  <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <div className="text-sm font-semibold text-slate-600 mb-2">开发周期（五阶段）</div>
                    <div className="space-y-2">
                      {(analysis.cycle || []).map((c, i) => (
                        <div key={i} className="flex items-center gap-3 text-sm">
                          <span className="w-24 text-slate-500">{c.phase}</span>
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.max(8, (c.days / (analysis.totalDays || 1)) * 100)}%` }} />
                          </div>
                          <span className="w-16 text-right text-slate-600">{c.days} 人天</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <div className="text-sm font-semibold text-slate-600 mb-2">风险与对策</div>
                    <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
                      {(analysis.risks || []).map((r, i) => <li key={i}>{r}</li>)}
                    </ul>
                  </div>
                </div>
              )}

              {!loading && tab === 'prd' && (
                <pre className="bg-white rounded-xl border border-slate-200 p-4 text-xs text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">{prd}</pre>
              )}

              {!loading && tab === 'proto' && (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100 text-xs text-slate-400">
                    <Eye size={13} /> 原型预览（可全屏查看）
                  </div>
                  <iframe title="prototype" srcDoc={prototypeHtml} className="w-full h-[52vh]" />
                </div>
              )}

              {!loading && tab === 'publish' && (
                <div className="space-y-4">
                  <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <div className="text-sm font-semibold text-slate-600 mb-2 flex items-center gap-1"><ExternalLink size={14} />选择集成目标</div>
                    {integrations.filter((i) => i.enabled && i.endpoint).length === 0 && (
                      <div className="text-sm text-amber-600">尚未配置可用的集成（需启用且填写地址）。请先到「集成中心」添加。</div>
                    )}
                    <div className="space-y-2 mt-2">
                      {integrations.filter((i) => i.enabled && i.endpoint).map((i) => (
                        <label key={i.id} className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                          <input type="radio" name="pub" checked={publishId === i.id} onChange={() => setPublishId(i.id)} />
                          {i.name}（{i.endpoint}）
                        </label>
                      ))}
                    </div>
                    <button onClick={publish} disabled={!publishId || publishMsg?.loading} className="mt-3 flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50">
                      {publishMsg?.loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} 推送到画板平台
                    </button>
                    {publishMsg && !publishMsg.loading && (
                      <div className={`mt-2 text-sm ${publishMsg.ok ? 'text-green-600' : 'text-red-500'}`}>{publishMsg.ok ? '✓ ' : '✗ '}{publishMsg.message}</div>
                    )}
                    {publishMsg && !publishMsg.ok && (
                      <div className="mt-1 text-xs text-slate-400">提示：纯前端推送可能因目标服务 CORS 限制失败，可在目标平台配置允许来源，或下载原型 HTML 后手动上传。</div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => downloadProto(prototypeHtml, requirement.title)} className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-sm"><FileText size={14} /> 下载原型 HTML</button>
                    <button onClick={() => downloadPRD(prd, requirement.title)} className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-sm"><FileText size={14} /> 下载需求文档</button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── 辅助 ─────────────────────────────────────────────────────────
async function loadFileTexts(requirement, files) {
  const ids = requirement.fileIds || []
  const texts = await Promise.all(ids.map(async (id) => {
    const meta = files.find((f) => f.id === id)
    if (!meta) return ''
    const ext = (meta.name.split('.').pop() || '').toLowerCase()
    if (!TEXT_PREVIEW_EXT.includes(ext)) return ''
    try { return await getText(id) } catch { return '' }
  }))
  return texts.filter(Boolean)
}

function pickKnowledge(requirement, knowledgeBase) {
  if (!knowledgeBase?.length) return []
  const tags = requirement.tags || []
  const hit = knowledgeBase.filter((k) => (k.tags || []).some((t) => tags.includes(t)))
  return (hit.length ? hit : knowledgeBase).slice(0, 5)
}

function downloadProto(html, title) {
  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${title || 'prototype'}.html`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
function downloadPRD(text, title) {
  const blob = new Blob([text], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${title || 'prd'}.md`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
