/**
 * AI Engine - 模拟 AI 分析能力
 * 为需求分析、任务生成、优先级排序提供智能建议
 */

const TAG_KEYWORDS = {
  'Bug修复': ['bug', 'Bug', '修复', '崩溃', '错误', '异常', '故障', '问题', '失效', '不显示', '无法', '闪退'],
  '功能优化': ['优化', '改进', '升级', '提升', '完善', '增强', '改善', '调整', '支持', '导出', '导入'],
  '新需求': ['新增', '新功能', '增加', '添加', '开发新', '希望', '想要', '需要新', '功能请求'],
  '数据需求': ['数据', '报表', '统计', '分析', '看板', '图表', '导出', '导入', '报告', '指标'],
  '体验优化': ['体验', '交互', '界面', 'UI', 'UX', '加载慢', '速度', '响应', '流畅', '美观', '样式'],
}

const HIGH_PRIORITY_KEYWORDS = ['紧急', 'ASAP', '影响收入', '崩溃', '无法使用', '严重', '立即', '尽快', '影响业务', '阻塞', '紧迫', '关键', '损失', '故障']
const LOW_PRIORITY_KEYWORDS = ['建议', '希望', '下季度', '长期', '有时间', '可以考虑', '未来', '规划']

/**
 * 分析需求内容，返回标签、优先级和摘要
 * @param {string} content - 需求内容
 * @returns {{ tags: string[], priority: '高'|'中'|'低', summary: string }}
 */
export function analyzeRequirement(content) {
  if (!content || content.trim() === '') {
    return { tags: ['新需求'], priority: '中', summary: '需求内容为空，请补充详细描述。' }
  }

  // 标签分析
  const detectedTags = []
  for (const [tag, keywords] of Object.entries(TAG_KEYWORDS)) {
    if (keywords.some((kw) => content.includes(kw))) {
      detectedTags.push(tag)
    }
  }
  const tags = detectedTags.length > 0 ? detectedTags.slice(0, 3) : ['新需求']

  // 优先级分析
  let priority = '中'
  if (HIGH_PRIORITY_KEYWORDS.some((kw) => content.includes(kw))) {
    priority = '高'
  } else if (LOW_PRIORITY_KEYWORDS.some((kw) => content.includes(kw))) {
    priority = '低'
  }

  // 摘要生成
  const trimmed = content.trim().replace(/\n+/g, ' ')
  const brief = trimmed.length > 60 ? trimmed.substring(0, 60) + '…' : trimmed

  const suggestions = {
    'Bug修复': '建议立即排查根因，安排紧急修复版本。',
    '功能优化': '建议纳入下个迭代版本，评估改造成本。',
    '新需求': '建议召开需求评审会，明确验收标准后排期。',
    '数据需求': '建议与数据团队协同，明确数据来源与口径。',
    '体验优化': '建议结合用户反馈数据，制定优化方案。',
  }
  const suggestion = suggestions[tags[0]] || '建议进一步细化需求，确认优先级后排入迭代。'

  const summary = `${brief} | ${suggestion}`

  return { tags, priority, summary }
}

/**
 * 根据需求生成任务建议
 * @param {object} requirement - 需求对象
 * @returns {{ title: string, desc: string, hours: number }}
 */
export function generateTask(requirement) {
  const { title, tags = [], priority, content } = requirement

  const tagHint = tags[0] || '新需求'

  const titleTemplates = {
    'Bug修复': `【修复】${title}`,
    '功能优化': `【优化】${title}`,
    '新需求': `【开发】${title}`,
    '数据需求': `【数据】${title}`,
    '体验优化': `【体验】${title}`,
  }

  const descTemplates = {
    'Bug修复': `根据需求「${title}」进行问题排查与修复，完成后需在测试环境验证，并同步给对应客户确认。`,
    '功能优化': `基于需求「${title}」进行功能升级开发，包括方案设计、开发实现及联调测试，完成后提交客户验收。`,
    '新需求': `负责需求「${title}」的评审与跟进，组织需求评审会，输出技术方案，跟踪开发进度至上线。`,
    '数据需求': `对接需求「${title}」，确认数据来源和统计口径，协同数据团队完成开发，验证数据准确性。`,
    '体验优化': `针对「${title}」进行用户体验优化，制定优化方案，跟进前端开发实现，完成A/B测试验证效果。`,
  }

  const hoursMap = {
    '高': 3,
    '中': 2,
    '低': 1,
  }

  const taskTitle = titleTemplates[tagHint] || `【跟进】${title}`
  const taskDesc = descTemplates[tagHint] || `跟进需求「${title}」的开发进度，确保按时高质量交付。`
  const hours = hoursMap[priority] || 2

  return {
    title: taskTitle,
    desc: taskDesc,
    hours,
  }
}

/**
 * 根据任务列表生成优先级排序建议
 * @param {Array} tasks - 任务列表
 * @returns {{ sorted: Array, reasoning: string }}
 */
export function generateDailyPriority(tasks) {
  if (!tasks || tasks.length === 0) {
    return { sorted: [], reasoning: '今日暂无任务，可以提前规划明日工作。' }
  }

  const priorityWeight = { '高': 3, '中': 2, '低': 1 }
  const statusWeight = { '进行中': 3, '待处理': 2, '已完成': 0 }

  const scored = tasks.map((task) => ({
    ...task,
    score: (priorityWeight[task.priority] || 1) * 2 + (statusWeight[task.status] || 0),
  }))

  const sorted = [...scored].sort((a, b) => b.score - a.score)

  const highCount = tasks.filter((t) => t.priority === '高').length
  const inProgressCount = tasks.filter((t) => t.status === '进行中').length
  const totalHours = tasks.reduce((sum, t) => sum + (t.hours || 0), 0)

  const reasoning = [
    `AI 分析了今日 ${tasks.length} 个任务（共约 ${totalHours} 小时）：`,
    highCount > 0 ? `• ${highCount} 个高优先级任务，建议优先完成` : null,
    inProgressCount > 0 ? `• ${inProgressCount} 个任务正在进行中，建议先完成以减少上下文切换` : null,
    totalHours > 6 ? `• 今日工作量较饱和，建议与团队确认是否可拆分或延期低优任务` : null,
    `• 建议专注时间块处理高优任务，避免频繁切换`,
  ]
    .filter(Boolean)
    .join('\n')

  return { sorted, reasoning }
}
