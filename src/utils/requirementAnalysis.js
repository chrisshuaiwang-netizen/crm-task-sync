/**
 * 需求分析引擎 — 可行性 / 难度 / 开发周期评估 + 对话追问 + PRD + 原型 + MCP 发布
 * 有 API Key 走真 LLM，否则走本地启发式降级（保证离线可用）。
 */
import { callLLM } from './llm'
import { TEXT_PREVIEW_EXT } from '../constants'
import { retrieveTopK } from './retrieval'
import useStore from '../store/useStore'

// ── 上下文拼装 ────────────────────────────────────────────────────
function buildContext(requirement, filesText = [], knowledge = []) {
  const parts = []
  parts.push(`# 需求\n标题：${requirement.title}\n描述：${requirement.content || '（无）'}\n优先级：${requirement.priority || '中'}`)
  if (filesText.length) {
    parts.push(`\n# 关联文件内容（节选）\n${filesText.slice(0, 3).map((t, i) => `--- 文件${i + 1} ---\n${t.slice(0, 2000)}`).join('\n')}`)
  }
  if (knowledge.length) {
    // RAG：按需求相关性召回 Top-K，替代全量硬塞，避免无关知识污染上下文
    const q = `${requirement.title}\n${requirement.content || ''}`
    const top = retrieveTopK(q, knowledge, 5, { textOf: (k) => `${k.title}\n${k.content || ''}` })
    if (top.length) {
      parts.push(`\n# 相关知识库（检索 Top ${top.length}）\n${top.map((k) => `- [${k.type}] ${k.title}：${(k.content || '').slice(0, 400)}`).join('\n')}`)
    }
  }
  return parts.join('\n')
}

function safeParseJSON(text) {
  try {
    return JSON.parse(text)
  } catch {
    const m = text.match(/\{[\s\S]*\}/)
    if (m) {
      try { return JSON.parse(m[0]) } catch { return null }
    }
    return null
  }
}

// ── 本地启发式降级 ─────────────────────────────────────────────────
function heuristicAnalysis(requirement, filesText) {
  const content = (requirement.content || '') + (requirement.title || '')
  const len = content.length
  const fileCount = filesText.length

  const hardKw = ['风控', '合规', '算法', '多平台', '集成', '实时', '权限', '加密', '并发', '大模型', '向量', 'rag']
  const easyKw = ['文案', '话术', '评审', '清单', '配置', '通知', '统计', '报表']

  let difficulty = '中'
  if (hardKw.some((k) => content.includes(k))) difficulty = '高'
  else if (easyKw.some((k) => content.includes(k))) difficulty = '低'

  let base = len < 80 ? 3 : len < 200 ? 6 : 10
  base += fileCount * 1
  if (difficulty === '高') base += 4
  if (requirement.priority === '高') base += 1

  const phases = [
    { phase: '需求澄清', days: Math.max(1, Math.round(base * 0.15)), note: '对齐验收指标与边界' },
    { phase: '方案设计', days: Math.max(1, Math.round(base * 0.2)), note: '交互/架构/数据口径' },
    { phase: '研发实现', days: Math.max(2, Math.round(base * 0.45)), note: '核心功能开发' },
    { phase: '测试验收', days: Math.max(1, Math.round(base * 0.15)), note: '用例回归与 badcase' },
    { phase: '上线交付', days: Math.max(1, Math.round(base * 0.05)), note: '灰度与演示数据' },
  ]
  const total = phases.reduce((s, p) => s + p.days, 0)

  const risks = []
  if (difficulty === '高') risks.push('涉及复杂逻辑/合规，建议先做技术预研（Spike）再排期。')
  if (fileCount === 0 && len < 100) risks.push('需求描述偏短，建议补充验收标准与场景后再推进。')
  if (requirement.priority === '高') risks.push('高优先级，注意与现有迭代的人力冲突。')
  if (!risks.length) risks.push('范围清晰，按标准阶段推进即可。')

  return {
    feasible: difficulty === '高' ? '高风险' : '可行',
    difficulty,
    totalDays: total,
    cycle: phases,
    risks,
    summary: `综合需求规模与复杂度，建议按「需求澄清→方案设计→研发实现→测试验收→上线交付」五阶段推进，预计约 ${total} 人天。`,
    suggestion: '可继续推进；建议先输出需求文档与可点击原型，与业务侧对齐功能范围。',
  }
}

// ── 主分析（返回结构化评估）──────────────────────────────────────
export async function analyzeRequirement({ requirement, filesText = [], knowledge = [], llmConfig }) {
  const ctx = buildContext(requirement, filesText, knowledge)
  const hasKey = llmConfig?.apiKey && llmConfig.apiKey.trim()

  if (!hasKey) {
    return { ...heuristicAnalysis(requirement, filesText), usedFallback: true }
  }

  const sys = useStore.getState().getPrompt('requirement_analyze')
  try {
    const text = await callLLM({
      providerId: llmConfig.provider,
      apiKey: llmConfig.apiKey,
      model: llmConfig.model,
      messages: [
        { role: 'system', content: sys },
        { role: 'user', content: ctx },
      ],
      opts: { json: true },
    })
    const parsed = safeParseJSON(text)
    if (!parsed) return { ...heuristicAnalysis(requirement, filesText), usedFallback: true }
    return { ...parsed, usedFallback: false }
  } catch (e) {
    return { ...heuristicAnalysis(requirement, filesText), usedFallback: true, error: e.message }
  }
}

// ── 对话追问（继续/暂搁前的多轮沟通）─────────────────────────────
export async function chatFollowup({ requirement, analysis, history = [], userMsg, filesText = [], knowledge = [], llmConfig }) {
  const ctx = buildContext(requirement, filesText, knowledge)
  const hasKey = llmConfig?.apiKey && llmConfig.apiKey.trim()
  if (!hasKey) {
    return `（本地模式）关于「${requirement.title}」：当前已评估难度【${analysis?.difficulty || '中'}】、预计【${analysis?.totalDays || '—'}】人天。${analysis?.summary || ''} 你可以直接说「继续推进」让我生成需求文档与原型，或补充说明范围/约束后我重新评估。`
  }
  const sys = useStore.getState().getPrompt('requirement_chat')
  const msgs = [
    { role: 'system', content: sys },
    { role: 'system', content: `背景：\n${ctx}\n\n初步评估：${JSON.stringify(analysis)}` },
    ...history.map((h) => ({ role: h.role, content: h.content })),
    { role: 'user', content: userMsg },
  ]
  try {
    return await callLLM({
      providerId: llmConfig.provider,
      apiKey: llmConfig.apiKey,
      model: llmConfig.model,
      messages: msgs,
      opts: { temperature: 0.4 },
    })
  } catch (e) {
    return `（模型调用失败，已降级）${e.message}`
  }
}

// ── 生成需求文档（Markdown）──────────────────────────────────────
export async function generatePRD({ requirement, analysis, knowledge = [], llmConfig }) {
  const hasKey = llmConfig?.apiKey && llmConfig.apiKey.trim()
  const kbRef = knowledge.length ? knowledge.map((k) => `- ${k.title}（${k.type}）`).join('\n') : '（无）'

  if (!hasKey) {
    const a = analysis || heuristicAnalysis(requirement, [])
    const cycles = (a.cycle || []).map((c) => `| ${c.phase} | ${c.days} 人天 | ${c.note || ''} |`).join('\n')
    return `# 需求文档：${requirement.title}

## 1. 背景与目标
${requirement.content || '（待补充）'}

## 2. 范围与验收标准
- 优先级：${requirement.priority || '中'}
- 关联客户：${requirement.customerName || '未关联'}
- 验收要点：请补充可量化指标（如解决率、响应时长、覆盖场景数）。

## 3. 实现难度与开发周期评估
- 可行性：${a.feasible} ｜ 难度：${a.difficulty} ｜ 预计：${a.totalDays} 人天
- 阶段拆分：

| 阶段 | 工期 | 说明 |
| --- | --- | --- |
${cycles}

## 4. 风险与对策
${(a.risks || []).map((r) => `- ${r}`).join('\n')}

## 5. 参考知识库
${kbRef}

> 由 Agent 智能业务管理系统基于需求分析自动生成（本地模式）。`
  }

  const sys = useStore.getState().getPrompt('prd_generate')
  try {
    return await callLLM({
      providerId: llmConfig.provider,
      apiKey: llmConfig.apiKey,
      model: llmConfig.model,
      messages: [
        { role: 'system', content: sys },
        {
          role: 'user',
          content: `需求：${requirement.title}\n${requirement.content || ''}\n客户：${requirement.customerName || '未关联'}\n评估：${JSON.stringify(analysis)}\n知识库：${kbRef}\n请生成需求文档。`,
        },
      ],
      opts: { temperature: 0.3 },
    })
  } catch (e) {
    return `# 需求文档：${requirement.title}\n\n（模型调用失败，已降级）${e.message}\n\n${requirement.content || ''}`
  }
}

// ── 生成 Demo 原型（自包含 HTML 线框）───────────────────────────
export function generatePrototypeHtml({ requirement, analysis }) {
  const title = requirement.title || '原型'
  const a = analysis || {}
  const blocks = (a.cycle || []).map((c) => `<li><b>${c.phase}</b> · ${c.days} 人天 — ${c.note || ''}</li>`).join('')
  return `<!doctype html><html lang="zh"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${title} · 原型</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0;font-family:-apple-system,"PingFang SC",sans-serif}
  body{background:#f1f5f9;color:#0f172a;padding:24px}
  .app{max-width:960px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,.08)}
  header{background:linear-gradient(120deg,#2563eb,#7c3aed);color:#fff;padding:22px 26px}
  header h1{font-size:20px} header p{opacity:.85;margin-top:6px;font-size:13px}
  .body{display:flex;min-height:360px}
  nav{width:180px;background:#f8fafc;border-right:1px solid #e2e8f0;padding:16px}
  nav .item{height:34px;background:#eef2ff;border-radius:8px;margin-bottom:10px;display:flex;align-items:center;padding:0 12px;font-size:13px;color:#4338ca}
  main{padding:22px;flex:1}
  .card{background:#f8fafc;border:1px dashed #cbd5e1;border-radius:12px;height:120px;margin-bottom:14px;display:flex;align-items:center;justify-content:center;color:#94a3b8;font-size:13px}
  .row{display:flex;gap:12px}.row .card{flex:1}
  footer{background:#0f172a;color:#cbd5e1;padding:14px 22px;font-size:12px}
  .meta{display:flex;gap:18px;padding:16px 22px;background:#fafafe;font-size:12px;color:#64748b;border-bottom:1px solid #eef2f7}
  .meta b{color:#0f172a}
  ul.phases{padding:16px 22px;font-size:13px;color:#334155;line-height:1.9}
</style></head>
<body><div class="app">
  <header><h1>${title}</h1><p>Agent 生成的 Demo 原型 · 难度【${a.difficulty || '中'}】 · 预计 ${a.totalDays || '—'} 人天</p></header>
  <div class="meta"><span>可行性：<b>${a.feasible || '可行'}</b></span><span>优先级：<b>${requirement.priority || '中'}</b></span><span>客户：<b>${requirement.customerName || '未关联'}</b></span></div>
  <div class="body">
    <nav><div class="item">首页</div><div class="item">功能</div><div class="item">详情</div><div class="item">设置</div></nav>
    <main>
      <div class="card">主内容区 / Hero</div>
      <div class="row"><div class="card">功能卡片 A</div><div class="card">功能卡片 B</div></div>
      <div class="card">列表 / 表单区</div>
    </main>
  </div>
  <ul class="phases">${blocks || '<li>阶段待评估</li>'}</ul>
  <footer>本原型由 Agent 智能业务管理系统生成，可用于与业务侧对齐功能范围。</footer>
</div></body></html>`
}

// ── 发布到集成（MCP / 画板平台）─────────────────────────────────
export async function publishToIntegration(integration, payload) {
  if (!integration?.endpoint || !integration.endpoint.trim()) {
    return { ok: false, message: '未配置集成地址（endpoint）' }
  }
  try {
    const res = await fetch(integration.endpoint.trim(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(integration.apiKey ? { Authorization: `Bearer ${integration.apiKey.trim()}` } : {}),
      },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      return { ok: false, message: `集成返回 ${res.status}：${detail.slice(0, 200)}` }
    }
    return { ok: true, message: '已推送到集成目标' }
  } catch (e) {
    return { ok: false, message: `推送失败（可能为浏览器跨域/CORS 或服务不可达）：${e.message}` }
  }
}
