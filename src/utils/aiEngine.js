/**
 * AI Engine — 智能分析能力集合
 * 原 Phase 0 为纯关键词规则引擎；现升级为「LLM 优先 + 本地规则回退」：
 * - 已配置 API Key 时走真 LLM（提示词在「提示词管理」页可编辑，key 见调用处）
 * - 未配置 / 调用失败时回退到下方本地关键词逻辑，保证离线可用
 *
 * 所有函数均为 async，返回结构保持向后兼容。
 */
import { callLLM } from './llm'
import useStore from '../store/useStore'

// ──────────────────────────────────────────────────────────────
// 本地规则回退（无 Key / 调用失败时使用，保持离线可用）
// ──────────────────────────────────────────────────────────────
const TAG_KEYWORDS = {
  Prompt调优: ['prompt', '提示词', '调优', '优化', 'few-shot', '系统提示', 'system', '话术', '人设', '指令'],
  模型迭代: ['模型', '切换', '升级', '对比', '选型', 'gpt', 'claude', 'qwen', 'deepseek', 'llm', '参数', '温度'],
  效果评测: ['评测', '评估', 'eval', '测试', '准确率', '回归', '指标', 'badcase', '评分', '基准', 'benchmark'],
  工具集成: ['工具', '集成', '接入', 'function', '调用', '插件', 'mcp', 'webhook', 'api', 'schema', '鉴权'],
  数据准备: ['数据', '标注', '数据集', '语料', '样本', '清洗', '知识库', '向量', 'embedding', 'rag'],
  问题修复: ['bug', '修复', '异常', '报错', '失败', '问题', '崩溃', '不稳定', '不生效', '报错'],
}

const HIGH_PRIORITY_KEYWORDS = ['紧急', 'ASAP', '阻塞', '严重影响', '崩溃', '无法使用', '严重', '立即', '尽快', '线上故障', '损失', '紧迫', '关键', 'deadline']
const LOW_PRIORITY_KEYWORDS = ['建议', '探索', '长期', '有时间', '可以考虑', '未来', '规划', '后续', '暂不']

function localAnalyzeTask(content) {
  if (!content || content.trim() === '') {
    return { tags: ['Prompt调优'], priority: '中', taskType: 'prompt', summary: '任务内容为空，请补充详细描述。' }
  }
  const detectedTags = []
  for (const [tag, keywords] of Object.entries(TAG_KEYWORDS)) {
    if (keywords.some((kw) => content.toLowerCase().includes(kw.toLowerCase()))) detectedTags.push(tag)
  }
  const tags = detectedTags.length > 0 ? detectedTags.slice(0, 3) : ['Prompt调优']
  let priority = '中'
  if (HIGH_PRIORITY_KEYWORDS.some((kw) => content.includes(kw))) priority = '高'
  else if (LOW_PRIORITY_KEYWORDS.some((kw) => content.includes(kw))) priority = '低'
  const PROMPT_TAGS = ['Prompt调优', '模型迭代', '效果评测']
  const taskType = tags.some((t) => PROMPT_TAGS.includes(t)) ? 'prompt' : 'feature'
  const brief = content.trim().replace(/\n+/g, ' ').slice(0, 60)
  const suggestions = {
    Prompt调优: '建议先在评测集上建立 baseline，迭代后回归验证效果。',
    模型迭代: '建议在相同评测集上对比候选模型，从效果、成本、延迟三维度选型。',
    效果评测: '建议构建覆盖核心场景的评测集，输出准确率与错误归因报告。',
    工具集成: '建议先定义工具 schema 与异常处理策略，再做集成与兜底设计。',
    数据准备: '建议明确数据来源与口径，覆盖难点场景后再作为评测基准。',
    问题修复: '建议优先定位根因，安排紧急修复并在评测集上回归。',
  }
  const suggestion = suggestions[tags[0]] || '建议进一步细化任务，明确验收标准后排入迭代。'
  return { tags, priority, taskType, summary: `${brief} | ${suggestion}` }
}

function localGenerateTask(task) {
  const { title, tags = [], priority } = task
  const tagHint = tags[0] || 'Prompt调优'
  const titleTemplates = {
    Prompt调优: `【调优】${title}`, 模型迭代: `【选型】${title}`, 效果评测: `【评测】${title}`,
    工具集成: `【集成】${title}`, 数据准备: `【数据】${title}`, 问题修复: `【修复】${title}`,
  }
  const descTemplates = {
    Prompt调优: `基于任务「${title}」优化 prompt，先建立 baseline，迭代后评测集回归验证效果提升。`,
    模型迭代: `对比候选模型完成任务「${title}」的效果，从准确率、成本、延迟三维度评估输出选型建议。`,
    效果评测: `为「${title}」构建评测集，覆盖核心场景，输出准确率与错误归因报告。`,
    工具集成: `为「${title}」定义工具 schema 与异常处理，完成集成与兜底话术设计。`,
    数据准备: `为「${title}」准备数据集与标注，明确数据来源与口径，作为评测基准。`,
    问题修复: `排查「${title}」根因，安排修复并在评测集上回归验证。`,
  }
  const hoursMap = { 高: 3, 中: 2, 低: 1 }
  return {
    subtasks: [{
      title: titleTemplates[tagHint] || `【跟进】${title}`,
      desc: descTemplates[tagHint] || `跟进任务「${title}」，确保按时高质量交付。`,
      hours: hoursMap[priority] || 2,
    }],
  }
}

function stripHtml(html = '') {
  return html
    .replace(/<\/?(li|p|h[1-6]|br)[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function localSummarizeDailyNote(note) {
  const { title = '', content = '', category = '其他' } = note
  const text = stripHtml(content)
  if (!text && !title.trim()) return '内容为空，无法生成总结，请先填写正文。'
  const ACTION_KW = ['确认', '跟进', '安排', '完成', '提交', '联系', '发送', '准备', '输出', '反馈', '推进', '处理', '对接', '评审', '上线']
  const DECISION_KW = ['决定', '确认', '确定', '同意', '通过', '结论', '方案', '明确', '约定', '达成', '采用']
  const RISK_KW = ['风险', '延期', '阻塞', '困难', '待解决', '未确认', '不确定', '问题', '报错', '回归失败']
  const hasActions = ACTION_KW.some((kw) => text.includes(kw) || title.includes(kw))
  const hasDecision = DECISION_KW.some((kw) => text.includes(kw))
  const hasRisk = RISK_KW.some((kw) => text.includes(kw))
  const parts = []
  const categoryIntro = { 会议: `本次评审/会议「${title}」已完成记录。`, 沟通: `本次沟通「${title}」已完成记录。`, 其他: `事项「${title}」已完成记录。` }
  parts.push(categoryIntro[category] || `记录「${title}」已完成。`)
  const brief = text.length > 80 ? text.substring(0, 80) + '…' : text
  if (brief) parts.push(`内容摘要：${brief}`)
  if (hasDecision) parts.push('已产生明确结论或决策，建议及时同步相关干系人。')
  if (hasActions) parts.push('存在待跟进事项，建议录入任务管理并设置提醒。')
  if (hasRisk) parts.push('涉及风险或阻塞点，建议重点关注并安排评测回归。')
  if (!hasDecision && !hasActions && category === '会议') parts.push('建议整理并分发评审纪要。')
  if (!hasDecision && !hasActions && category === '沟通') parts.push('建议将重要结论同步给相关人员。')
  return parts.join(' ')
}

function localGenerateDailyPriority(tasks) {
  if (!tasks || tasks.length === 0) return { sorted: [], reasoning: '今日暂无任务，可以提前规划明日工作。' }
  const priorityWeight = { 高: 3, 中: 2, 低: 1 }
  const statusWeight = { 开发中: 3, 设计中: 2, 待评测: 2, 待启动: 1, 已完成: 0, 已暂停: 0, 已取消: 0 }
  const scored = tasks.map((task) => ({ ...task, score: (priorityWeight[task.priority] || 1) * 2 + (statusWeight[task.status] || 0) }))
  const sorted = [...scored].sort((a, b) => b.score - a.score)
  const highCount = tasks.filter((t) => t.priority === '高').length
  const inProgressCount = tasks.filter((t) => t.status === '开发中' || t.status === '设计中').length
  const promptCount = tasks.filter((t) => t.taskType === 'prompt').length
  const featureCount = tasks.filter((t) => t.taskType === 'feature').length
  const reasoning = [
    `AI 分析了 ${tasks.length} 个任务（Prompt 类 ${promptCount} / 功能类 ${featureCount}）：`,
    highCount > 0 ? `• ${highCount} 个高优先级任务，建议优先完成` : null,
    inProgressCount > 0 ? `• ${inProgressCount} 个任务进行中，建议先收口以减少上下文切换` : null,
    `• 建议优先处理 prompt 迭代类任务（效果可量化、反馈快），再推进功能集成`,
  ].filter(Boolean).join('\n')
  return { sorted, reasoning }
}

// ──────────────────────────────────────────────────────────────
// LLM 优先实现
// ──────────────────────────────────────────────────────────────
function getCfg() {
  const { llmConfig } = useStore.getState()
  return llmConfig?.apiKey && llmConfig.apiKey.trim() ? llmConfig : null
}

/** 分析任务内容：标签 / 优先级 / 类型 / 摘要 */
export async function analyzeTask(content) {
  const cfg = getCfg()
  if (!cfg) return localAnalyzeTask(content)
  try {
    const sys = useStore.getState().getPrompt('task_analyze')
    const raw = await callLLM({
      providerId: cfg.provider, apiKey: cfg.apiKey, model: cfg.model,
      messages: [{ role: 'system', content: sys }, { role: 'user', content: `任务内容：\n${content}` }],
      opts: { temperature: 0.3, json: true },
    })
    const p = JSON.parse(raw)
    const tags = Array.isArray(p.tags) ? p.tags.slice(0, 3) : ['其他']
    const priority = ['高', '中', '低'].includes(p.priority) ? p.priority : '中'
    const taskType = p.taskType === 'feature' ? 'feature' : 'prompt'
    return { tags, priority, taskType, summary: p.summary || content.slice(0, 60) }
  } catch {
    return localAnalyzeTask(content)
  }
}

/** 将任务拆解为子任务 */
export async function generateTask(task) {
  const cfg = getCfg()
  if (!cfg) return localGenerateTask(task)
  try {
    const sys = useStore.getState().getPrompt('task_decompose')
    const raw = await callLLM({
      providerId: cfg.provider, apiKey: cfg.apiKey, model: cfg.model,
      messages: [{ role: 'system', content: sys }, { role: 'user', content: `任务：\n标题：${task.title}\n标签：${(task.tags || []).join('、')}\n优先级：${task.priority || '中'}\n类型：${task.taskType || 'feature'}` }],
      opts: { temperature: 0.4, json: true },
    })
    const p = JSON.parse(raw)
    const subs = Array.isArray(p.subtasks) ? p.subtasks : []
    return { subtasks: subs.map((s) => ({ title: (s.title || '').slice(0, 40), desc: s.desc || '', hours: Number(s.hours) || 2 })) }
  } catch {
    return localGenerateTask(task)
  }
}

/** 工作笔记智能总结 */
export async function summarizeDailyNote(note) {
  const { title = '', content = '', category = '其他' } = note
  const text = stripHtml(content)
  const cfg = getCfg()
  if (!cfg) return localSummarizeDailyNote(note)
  try {
    const tpl = useStore.getState().getPrompt('daily_summary')
    const sys = tpl.replace('{{note_text}}', `标题：${title}\n类别：${category}\n正文：\n${text}`)
    const raw = await callLLM({
      providerId: cfg.provider, apiKey: cfg.apiKey, model: cfg.model,
      messages: [{ role: 'system', content: sys }],
      opts: { temperature: 0.4 },
    })
    return raw.trim() || localSummarizeDailyNote(note)
  } catch {
    return localSummarizeDailyNote(note)
  }
}

/** 任务优先级排序 */
export async function generateDailyPriority(tasks) {
  if (!tasks || tasks.length === 0) return { sorted: [], reasoning: '今日暂无任务，可以提前规划明日工作。' }
  const cfg = getCfg()
  if (!cfg) return localGenerateDailyPriority(tasks)
  try {
    const sys = useStore.getState().getPrompt('daily_priority') || ''
    const list = tasks.map((t, i) => `${i + 1}. [id=${t.id}] ${t.title} | 优先级:${t.priority || '中'} | 状态:${t.status || ''} | 类型:${t.taskType || ''}`).join('\n')
    const raw = await callLLM({
      providerId: cfg.provider, apiKey: cfg.apiKey, model: cfg.model,
      messages: [{ role: 'system', content: sys }, { role: 'user', content: `任务列表：\n${list}` }],
      opts: { temperature: 0.3, json: true },
    })
    const p = JSON.parse(raw)
    const orderIds = Array.isArray(p.order) ? p.order : []
    const byId = new Map(tasks.map((t) => [t.id, t]))
    const ordered = orderIds.map((id) => byId.get(id)).filter(Boolean)
    const rest = tasks.filter((t) => !orderIds.includes(t.id))
    return { sorted: [...ordered, ...rest], reasoning: p.reasoning || '已按推荐顺序排序。' }
  } catch {
    return localGenerateDailyPriority(tasks)
  }
}
