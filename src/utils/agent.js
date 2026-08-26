/**
 * 智能助手「确认执行型」引擎
 * 输入自然语言 → 意图识别 + 结构化计划（items 可含 task / requirement / customer / meeting）
 * 写操作返回预览，由 UI 确认后调用 store 执行；读操作直接返回结论。
 * 未配置 Key 时回退到本地启发式解析，保证功能可用。
 */
import { callLLM } from './llm'
import useStore from '../store/useStore'
import { analyzeTask, generateTask, generateDailyPriority, summarizeDailyNote } from './aiEngine'
import {
  ALL_TAGS,
  TASK_SOURCES,
  TASK_STATUSES,
  REQUIREMENT_STATUSES,
  REQUIREMENT_TAGS,
  CUSTOMER_STATUSES,
  DEAL_STAGES,
  MEETING_CATEGORIES,
} from '../constants'

const SYSTEM_PROMPT = `你是一个企业业务管理智能助手（确认执行型）。用户会用自然语言下达指令，可能是创建任务/需求/客户/会议纪要，也可能是查询。
请做意图识别，输出结构化「执行计划」JSON，不要输出多余内容。

输出格式（严格 JSON）：
{
  "summary": "一句话说明将要做什么（写操作）或查询结论（读操作）",
  "items": [
    {
      "kind": "task | requirement | customer | meeting",
      "title": "标题（必填，不超过 24 字）",
      "content": "背景/目标（必填，1-3 句）",
      "customer": "客户名称（能推断则填，否则空）",
      "priority": "高 | 中 | 低",
      "status": "对应状态（task:待启动/进行中/已完成；requirement:待评审/已采纳/设计中/开发中/测试中/已上线；customer:初步接触/需求沟通/方案输出/商务谈判/已成单/已流失；meeting 忽略）",
      "tags": ["标签(可选)"],
      "deadline": "截止日 YYYY-MM-DD（能推断则填，否则空）",
      "scheduledDate": "计划执行日 YYYY-MM-DD（否则空）",
      "source": "客户反馈|会议记录|产品规划|领导交办|主动发现|其他",
      "industry": "行业（仅 customer；金融/零售电商/制造/医疗健康/教育/企业服务/政企/其他）",
      "contact": "联系人（仅 customer）",
      "stage": "成单阶段（仅 deal，可选）",
      "category": "会议纪要分类（仅 meeting：评审会/客户会/周会/站会/其他）"
    }
  ]
}

规则：
- 写操作（创建）才放 items；查询/纯对话 items 为空数组。
- 一段话可能包含多个待办，逐条拆分。
- 只输出 JSON，不要解释。`

// 能力/查询指引：追加到意图识别 system prompt，使助手支持「查询与 AI 能力调用」
const ACTION_GUIDE = `\n若用户意图是「查询或使用 AI 能力」而非创建数据，请在 JSON 中加 "action" 字段：
"action": { "type": "能力类型", "args": { ... } }
支持类型：
- analyze_task：分析一段任务描述（args.text）
- decompose_task：将某任务拆解为子任务（args.taskId 或 args.text 标题）
- prioritize_tasks：对当前任务列表做优先级排序
- summarize：总结一段文字/笔记（args.text）
- list_overdue_tasks：列出逾期任务
- weekly_progress：本周任务进度汇总
- list_customers：列出客户
此时 items 必须为空数组。查询类也可直接以 summary 作为自然语言回答。`

function normItem(raw) {
  const priority = ['高', '中', '低'].includes(raw.priority) ? raw.priority : '中'
  const tags = Array.isArray(raw.tags) ? raw.tags.filter((t) => ALL_TAGS.includes(t)).slice(0, 3) : []
  const source = TASK_SOURCES.includes(raw.source) ? raw.source : '其他'
  const base = {
    title: (raw.title || '').toString().trim().slice(0, 40),
    content: (raw.content || '').toString().trim(),
    customerName: (raw.customer || '').toString().trim(),
    priority,
    tags,
    deadline: (raw.deadline || '').toString().trim(),
    scheduledDate: (raw.scheduledDate || '').toString().trim(),
    source,
  }
  if (raw.kind === 'requirement') {
    return {
      kind: 'requirement',
      ...base,
      status: REQUIREMENT_STATUSES.includes(raw.status) ? raw.status : '待评审',
      tags: Array.isArray(raw.tags) ? raw.tags.filter((t) => REQUIREMENT_TAGS.includes(t)).slice(0, 3) : [],
    }
  }
  if (raw.kind === 'customer') {
    return {
      kind: 'customer',
      name: (raw.title || raw.customer || '').toString().trim().slice(0, 40),
      industry: (raw.industry && CUSTOMER_INDUSTRIES_FALLBACK(raw.industry)) || '其他',
      priority,
      status: CUSTOMER_STATUSES.includes(raw.status) ? raw.status : '初步接触',
      contact: (raw.contact || '').toString().trim(),
      notes: base.content,
    }
  }
  if (raw.kind === 'meeting') {
    return {
      kind: 'meeting',
      title: (raw.title || '').toString().trim().slice(0, 40),
      content: base.content,
      category: MEETING_CATEGORIES.includes(raw.category) ? raw.category : '其他',
      date: (raw.deadline || '').toString().trim(),
      todos: [],
    }
  }
  // 默认 task
  return { kind: 'task', ...base, status: TASK_STATUSES.includes(raw.status) ? raw.status : '待启动' }
}

function CUSTOMER_INDUSTRIES_FALLBACK(v) {
  const list = ['金融', '零售电商', '制造', '医疗健康', '教育', '企业服务', '政企', '其他']
  return list.includes(v) ? v : '其他'
}

/** 本地启发式回退 */
function localFallback(text) {
  const clean = text.trim()
  // 查询类 action（无需 LLM，本地即可执行）
  if (/(逾期|超期|过期)/.test(clean)) return { summary: '以下是逾期任务：', items: [], action: { type: 'list_overdue_tasks', args: {} }, usedFallback: true }
  if (/(本周|这周|本周进度|周报|进展)/.test(clean)) return { summary: '本周进度汇总：', items: [], action: { type: 'weekly_progress', args: {} }, usedFallback: true }
  if (/(客户列表|所有客户|全部客户|列客户)/.test(clean)) return { summary: '客户列表：', items: [], action: { type: 'list_customers', args: {} }, usedFallback: true }
  // 客户
  const custMatch = clean.match(/(?:新增|新建|录入|添加)客户[：:]?\s*([^\n，。；]+)/)
  if (custMatch) {
    return {
      summary: `将创建客户「${custMatch[1].trim()}」`,
      items: [{ kind: 'customer', name: custMatch[1].trim(), industry: '其他', priority: '中', status: '初步接触', contact: '', notes: clean }],
    }
  }
  // 会议纪要
  if (clean.includes('会议纪要') || clean.includes('会议记录') || clean.includes('开会')) {
    return {
      summary: '将创建一条会议纪要',
      items: [{ kind: 'meeting', title: clean.slice(0, 24), content: clean, category: '其他', date: '', todos: [] }],
    }
  }
  // 默认：按标点拆成任务
  const segments = clean.split(/[。；;\n]+/).map((s) => s.trim()).filter((s) => s.length >= 4)
  return {
    summary: `将创建 ${segments.length} 条任务`,
    items: segments.map((seg) => ({
      kind: 'task',
      title: seg.slice(0, 18),
      content: seg,
      customerName: '',
      priority: '中',
      status: '待启动',
      tags: [],
      deadline: '',
      scheduledDate: '',
      source: '其他',
    })),
  }
}

/**
 * 解析自然语言输入为执行计划
 * @returns {Promise<{summary, items: Array, usedFallback: boolean, error?: string}>}
 */
export async function analyzeInput(text, { llmConfig, customers = [], history = [] }) {
  const clean = (text || '').trim()
  if (!clean) return { summary: '', items: [], usedFallback: false }

  const hasKey = llmConfig?.apiKey && llmConfig.apiKey.trim()
  if (!hasKey) return { ...localFallback(clean), usedFallback: true }

  try {
    let sys = useStore.getState().getPrompt('intent_recognize') || SYSTEM_PROMPT
    if (!sys.includes('action')) sys += ACTION_GUIDE
    const msgs = [
      { role: 'system', content: sys },
      ...history.slice(-8).map((h) => ({ role: h.role === 'assistant' ? 'assistant' : 'user', content: h.content })),
      {
        role: 'user',
        content: `已知客户列表：${customers.map((c) => c.name).join('、') || '（无）'}\n\n请处理以下指令：\n${clean}`,
      },
    ]
    const raw = await callLLM({
      providerId: llmConfig.provider,
      apiKey: llmConfig.apiKey,
      model: llmConfig.model,
      messages: msgs,
      opts: { temperature: 0.3, json: true },
    })
    const parsed = JSON.parse(raw)
    const items = (Array.isArray(parsed?.items) ? parsed.items : [])
      .map(normItem)
      .filter((it) => it.title || it.name)
    const action = parsed.action && parsed.action.type ? { type: parsed.action.type, args: parsed.action.args || {} } : null
    return { summary: parsed.summary || (items.length ? `将创建 ${items.length} 项` : '已收到'), items, action, usedFallback: false }
  } catch (e) {
    return { ...localFallback(clean), usedFallback: true, error: e.message }
  }
}

/** 将解析出的 items 关联客户后执行创建，返回执行结果描述 */
export function executePlan(items, { customers, store }) {
  const results = []
  for (const it of items) {
    const hit = customers.find(
      (c) => it.customerName && (c.name.includes(it.customerName) || it.customerName.includes(c.name))
    )
    const customerId = hit ? hit.id : null
    if (it.kind === 'customer') {
      store.addCustomer({ name: it.name, industry: it.industry, priority: it.priority, status: it.status, contact: it.contact, notes: it.notes })
      results.push(`客户「${it.name}」已创建`)
    } else if (it.kind === 'requirement') {
      store.addRequirement({ title: it.title, content: it.content, customerId, priority: it.priority, status: it.status, tags: it.tags, source: it.source, deadline: it.deadline })
      results.push(`需求「${it.title}」已创建`)
    } else if (it.kind === 'meeting') {
      store.addMeeting({ title: it.title, content: it.content, category: it.category, date: it.date || new Date().toISOString().slice(0, 10), relatedCustomerIds: customerId ? [customerId] : [], todos: it.todos || [] })
      results.push(`会议纪要「${it.title}」已创建`)
    } else {
      store.addTask({
        title: it.title,
        content: it.content,
        customerId,
        priority: it.priority,
        status: it.status,
        source: it.source,
        deadline: it.deadline,
        scheduledDate: it.scheduledDate,
        tags: it.tags,
      })
      results.push(`任务「${it.title}」已创建`)
    }
  }
  return results
}

/**
 * 执行「查询 / AI 能力」类 action，返回结构化结果供 UI 渲染
 * @param {object} action { type, args }
 * @param {object} [ctx] { store }
 */
export async function executeAbility(action, { store } = {}) {
  const st = store || useStore.getState()
  if (!action || !action.type) return { kind: 'text', title: '', text: '未识别到可执行的查询或能力。' }
  const { type, args = {} } = action
  const today = new Date().toISOString().slice(0, 10)

  if (type === 'list_overdue_tasks') {
    const rows = st.tasks
      .filter((t) => t.status !== '已完成' && t.status !== '已取消' && t.deadline && t.deadline < today)
      .map((t) => ({
        title: t.title,
        customer: st.customers.find((c) => c.id === t.customerId)?.name || '—',
        deadline: t.deadline,
        priority: t.priority,
        status: t.status,
      }))
    return { kind: 'tasks', title: `逾期任务（${rows.length}）`, rows }
  }
  if (type === 'list_customers') {
    const rows = st.customers.map((c) => ({ name: c.name, industry: c.industry, status: c.status, priority: c.priority }))
    return { kind: 'customers', title: `客户（${rows.length}）`, rows }
  }
  if (type === 'weekly_progress') {
    const tasks = st.tasks
    const total = tasks.length
    const done = tasks.filter((t) => t.status === '已完成').length
    const overdue = tasks.filter((t) => t.status !== '已完成' && t.status !== '已取消' && t.deadline && t.deadline < today).length
    const byCust = {}
    tasks.forEach((t) => {
      const n = st.customers.find((c) => c.id === t.customerId)?.name || '未关联'
      byCust[n] = (byCust[n] || 0) + 1
    })
    const text = `本周共 ${total} 个任务，已完成 ${done} 个，逾期 ${overdue} 个。\n按客户分布：${Object.entries(byCust).map(([k, v]) => `${k} ${v}`).join('、')}。`
    return { kind: 'text', title: '本周进度', text }
  }
  if (type === 'analyze_task') {
    const r = await analyzeTask(args.text || '')
    return { kind: 'task_analysis', title: '任务分析', data: r }
  }
  if (type === 'decompose_task') {
    const task = args.taskId
      ? st.tasks.find((t) => t.id === args.taskId)
      : st.tasks.find((t) => args.text && t.title && t.title.includes(args.text))
    if (!task) return { kind: 'text', text: '未找到对应任务，请说明任务标题。' }
    const r = await generateTask(task)
    return { kind: 'subtasks', title: `拆解：${task.title}`, subtasks: r.subtasks, taskId: task.id }
  }
  if (type === 'prioritize_tasks') {
    const r = await generateDailyPriority(st.tasks)
    return { kind: 'priority', title: '任务优先级排序', sorted: r.sorted, reasoning: r.reasoning }
  }
  if (type === 'summarize') {
    const text = await summarizeDailyNote({ title: '', content: args.text || '' })
    return { kind: 'text', title: '总结', text }
  }
  return { kind: 'text', text: '暂不支持该能力。' }
}
