import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ── 日期辅助：让示例数据围绕「本周」展开，看板/报告才有内容 ──
const now = new Date()
const DAY = 86400000
const monday = (() => {
  const d = new Date(now)
  const wd = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - wd)
  d.setHours(0, 0, 0, 0)
  return d
})()
const pad = (n) => String(n).padStart(2, '0')
const fmtDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const dateOffset = (n) => fmtDate(new Date(monday.getTime() + n * DAY))
const isoOffset = (n) => new Date(monday.getTime() + n * DAY).toISOString()

// ── 示例数据：客户（含状态机 + 负责人）─────────────────────────────
const sampleCustomers = [
  {
    id: 'c1',
    name: '华夏银行信用卡中心',
    industry: '金融',
    priority: '高',
    status: '方案输出',
    owner: '张明',
    contact: '李总',
    phone: '138****0001',
    notes: '核心客户，推进智能客服与风控 Agent 落地。当前卡在验收标准对齐，需本周出 POC 方案。',
    createdAt: isoOffset(-30),
  },
  {
    id: 'c2',
    name: '云帆零售集团',
    industry: '零售电商',
    priority: '高',
    status: '需求沟通',
    owner: '李婷',
    contact: '王采购',
    phone: '139****0002',
    notes: '新零售会员运营场景，关注营销文案与导购 Agent 效果。已签框架协议，进入需求细化。',
    createdAt: isoOffset(-20),
  },
  {
    id: 'c3',
    name: '康宁医疗科技',
    industry: '医疗健康',
    priority: '中',
    status: '方案输出',
    owner: '王浩',
    contact: '赵主任',
    phone: '137****0003',
    notes: '院内智能问答与随访 Agent，对合规与数据安全要求高。处于方案设计阶段。',
    createdAt: isoOffset(-10),
  },
  {
    id: 'c4',
    name: '启智教育',
    industry: '教育',
    priority: '中',
    status: '初步接触',
    owner: '陈雪',
    contact: '刘校长',
    phone: '136****0004',
    notes: '智能辅导与学情分析 Agent，关注准确率与可解释性。刚完成首轮评测。',
    createdAt: isoOffset(-5),
  },
]

// ── 示例数据：需求（独立于任务）──────────────────────────────────
const sampleRequirements = [
  {
    id: 'r1',
    title: '华夏银行智能客服 POC',
    content: '覆盖退款场景与风控问答，需对齐验收指标（解决率≥85%、转人工率≤15%），准备演示数据。',
    customerId: 'c1',
    priority: '高',
    status: '已采纳',
    tags: ['新需求'],
    source: '客户反馈',
    ownerId: 'm-owner',
    expectedWorkload: 5,
    deadline: dateOffset(7),
    aiSummary: '华夏银行智能客服 POC，覆盖退款与风控问答，需对齐验收指标。',
    createdAt: isoOffset(-3),
    updatedAt: isoOffset(-2),
    statusHistory: [{ status: '已采纳', at: isoOffset(-2) }],
    relatedTaskIds: ['t1'],
    fileIds: [],
    analysis: null,
    prd: '',
    prototypeHtml: '',
  },
  {
    id: 'r2',
    title: '云帆零售营销文案 Agent',
    content: '多平台文案生成，品牌调性约束与 A/B 变体数量，需求评审确认范围。',
    customerId: 'c2',
    priority: '高',
    status: '待评审',
    tags: ['新需求'],
    source: '会议记录',
    ownerId: 'm-owner',
    expectedWorkload: 3,
    deadline: dateOffset(10),
    aiSummary: '云帆零售营销文案 Agent，确认生成范围与品牌约束。',
    createdAt: isoOffset(-1),
    updatedAt: isoOffset(-1),
    statusHistory: [{ status: '待评审', at: isoOffset(-1) }],
    relatedTaskIds: ['t2'],
    fileIds: [],
    analysis: null,
    prd: '',
    prototypeHtml: '',
  },
  {
    id: 'r3',
    title: '康宁医疗随访 Agent 合规审查',
    content: '梳理随访话术合规边界，与法务对齐数据脱敏方案。',
    customerId: 'c3',
    priority: '中',
    status: '设计中',
    tags: ['性能优化'],
    source: '产品规划',
    ownerId: 'm-owner',
    expectedWorkload: 4,
    deadline: dateOffset(15),
    aiSummary: '康宁医疗随访 Agent 合规审查，对齐话术边界与数据脱敏。',
    createdAt: isoOffset(-8),
    updatedAt: isoOffset(-3),
    statusHistory: [{ status: '设计中', at: isoOffset(-3) }],
    relatedTaskIds: ['t3'],
    fileIds: [],
    analysis: null,
    prd: '',
    prototypeHtml: '',
  },
]

// ── 示例数据：工作任务（含排期日 + 状态变更历史 + 关联需求/项目）──
const sampleTasks = [
  {
    id: 't1',
    title: '华夏银行智能客服 POC 方案',
    content: '客户要求本周内出 POC 方案，覆盖退款场景与风控问答。需对齐验收指标并准备演示数据。',
    customerId: 'c1',
    requirementId: 'r1',
    projectId: 'p1',
    tags: ['方案设计', '客户跟进'],
    priority: '高',
    status: '进行中',
    source: '客户反馈',
    deadline: dateOffset(4),
    scheduledDate: dateOffset(1),
    aiSummary: '华夏银行要求本周出智能客服 POC 方案。',
    createdAt: isoOffset(-3),
    updatedAt: isoOffset(-2),
    statusHistory: [{ status: '进行中', at: isoOffset(-2) }],
  },
  {
    id: 't2',
    title: '云帆零售营销文案 Agent 需求评审',
    content: '组织需求评审会，确认多平台文案生成范围、品牌调性约束与 A/B 变体数量。',
    customerId: 'c2',
    requirementId: 'r2',
    tags: ['需求处理', '商务沟通'],
    priority: '高',
    status: '待启动',
    source: '会议记录',
    deadline: dateOffset(7),
    scheduledDate: dateOffset(2),
    aiSummary: '云帆零售营销文案 Agent 需求评审。',
    createdAt: isoOffset(-1),
    updatedAt: isoOffset(-1),
    statusHistory: [{ status: '待启动', at: isoOffset(-1) }],
  },
  {
    id: 't3',
    title: '康宁医疗随访 Agent 合规审查',
    content: '梳理随访话术的合规边界，确保不触诊、不给出医疗建议。与法务对齐数据脱敏方案。',
    customerId: 'c3',
    requirementId: 'r3',
    tags: ['方案设计', '问题修复'],
    priority: '中',
    status: '进行中',
    source: '产品规划',
    deadline: dateOffset(15),
    scheduledDate: dateOffset(3),
    aiSummary: '康宁医疗随访 Agent 合规审查。',
    createdAt: isoOffset(-8),
    updatedAt: isoOffset(-3),
    statusHistory: [{ status: '进行中', at: isoOffset(-3) }],
  },
  {
    id: 't4',
    title: '启智教育学情分析 Agent 评测复盘',
    content: '首轮评测准确率 82%，偏低。分析错误归因，输出改进项与二轮评测计划。',
    customerId: 'c4',
    tags: ['数据复盘'],
    priority: '中',
    status: '已完成',
    source: '主动发现',
    deadline: dateOffset(-5),
    scheduledDate: dateOffset(-5),
    aiSummary: '启智教育学情分析 Agent 首轮评测复盘。',
    createdAt: isoOffset(-9),
    updatedAt: isoOffset(-5),
    statusHistory: [
      { status: '进行中', at: isoOffset(-8) },
      { status: '已完成', at: isoOffset(-5) },
    ],
  },
  {
    id: 't5',
    title: '华夏银行风控问答 Demo 数据准备',
    content: '准备风控常见问答对 200 条，覆盖盗刷、限额、冻结等场景。',
    customerId: 'c1',
    requirementId: 'r1',
    tags: ['数据复盘', '客户跟进'],
    priority: '中',
    status: '待启动',
    source: '领导交办',
    deadline: dateOffset(9),
    scheduledDate: dateOffset(4),
    aiSummary: '为华夏银行风控问答准备 200 条演示问答对。',
    createdAt: isoOffset(0),
    updatedAt: isoOffset(0),
    statusHistory: [{ status: '待启动', at: isoOffset(0) }],
  },
  {
    id: 't6',
    title: '华夏银行验收指标对齐会',
    content: '与客户对齐 POC 验收指标，解决率与转人工率标准达成一致。',
    customerId: 'c1',
    requirementId: 'r1',
    tags: ['客户跟进', '方案设计'],
    priority: '高',
    status: '已完成',
    source: '会议记录',
    deadline: dateOffset(0),
    scheduledDate: dateOffset(0),
    aiSummary: '对齐 POC 验收指标，达成解决率≥85%、转人工率≤15%。',
    createdAt: isoOffset(-2),
    updatedAt: isoOffset(0),
    statusHistory: [
      { status: '待启动', at: isoOffset(-2) },
      { status: '进行中', at: isoOffset(-1) },
      { status: '已完成', at: isoOffset(0) },
    ],
  },
]

// ── 示例数据：项目 ────────────────────────────────────────────────
const sampleProjects = [
  {
    id: 'p1',
    name: '华夏银行智能客服 Agent',
    description: '智能客服 + 风控问答 POC，覆盖退款与风控场景，目标验收解决率≥85%。',
    customerId: 'c1',
    ownerId: 'm-owner',
    startDate: dateOffset(-10),
    endDate: dateOffset(14),
    status: '进行中',
    members: ['m-owner'],
    riskLevel: '中',
    milestones: [
      { name: '需求对齐', date: dateOffset(-3), done: true },
      { name: 'POC 方案', date: dateOffset(4), done: false },
      { name: '现场演示', date: dateOffset(12), done: false },
    ],
    createdAt: isoOffset(-10),
  },
  {
    id: 'p2',
    name: '云帆零售营销文案 Agent',
    description: '多平台营销文案生成，品牌调性约束 + A/B 变体。',
    customerId: 'c2',
    ownerId: 'm-owner',
    startDate: dateOffset(-5),
    endDate: dateOffset(20),
    status: '规划中',
    members: ['m-owner'],
    riskLevel: '低',
    milestones: [
      { name: '需求评审', date: dateOffset(7), done: false },
      { name: '首版上线', date: dateOffset(18), done: false },
    ],
    createdAt: isoOffset(-5),
  },
]

// ── 示例数据：成单 ────────────────────────────────────────────────
const sampleDeals = [
  {
    id: 'd1',
    customerId: 'c1',
    name: '智能客服 POC 框架合同',
    amount: 120,
    stage: '合同评审',
    ownerId: 'm-owner',
    expectedCloseDate: dateOffset(20),
    actualCloseDate: '',
    status: '进行中',
    createdAt: isoOffset(-6),
  },
  {
    id: 'd2',
    customerId: 'c2',
    name: '营销文案 Agent 年度服务',
    amount: 80,
    stage: '商务谈判',
    ownerId: 'm-owner',
    expectedCloseDate: dateOffset(25),
    actualCloseDate: '',
    status: '进行中',
    createdAt: isoOffset(-4),
  },
]

// ── 示例数据：会议纪要 ─────────────────────────────────────────────
const todayStr = now.toISOString().split('T')[0]
const yesterdayStr = new Date(now.getTime() - DAY).toISOString().split('T')[0]

const sampleMeetings = [
  {
    id: 'mt1',
    title: '华夏银行 POC 对齐会',
    content:
      '<p>与客户对齐 POC 验收指标。</p><ul><li>解决率≥85%、转人工率≤15% 通过</li><li>演示数据由我方准备，周五前到位</li><li>下周安排现场演示</li></ul>',
    date: todayStr,
    category: '客户会',
    attendeeIds: ['m-owner'],
    relatedCustomerIds: ['c1'],
    relatedProjectIds: ['p1'],
    todos: [
      { content: '准备风控演示数据 200 条', owner: '张明', deadline: dateOffset(4), done: false },
      { content: '确认现场演示时间', owner: '李婷', deadline: dateOffset(7), done: true },
    ],
    aiSummary: '对齐验收指标，达成解决率≥85%。待办：演示数据准备、现场演示排期。',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'mt2',
    title: '云帆需求评审',
    content: '<p>营销文案范围确认。</p><p><strong>结论：</strong>先 cover 公众号+小红书，短视频脚本二期。</p>',
    date: yesterdayStr,
    category: '评审会',
    attendeeIds: ['m-owner'],
    relatedCustomerIds: ['c2'],
    relatedProjectIds: ['p2'],
    todos: [{ content: '输出评审结论与排期', owner: '李婷', deadline: dateOffset(2), done: false }],
    aiSummary: '确认先覆盖公众号+小红书，短视频脚本二期。',
    createdAt: new Date().toISOString(),
  },
]

// ── 示例数据：审计日志 ─────────────────────────────────────────────
const sampleAudit = [
  { id: 'a1', actor: '我', action: '初始化', target: '工作区', detail: '默认工作区数据已生成', at: isoOffset(0) },
  { id: 'a2', actor: '我', action: '创建', target: '需求 r1', detail: '华夏银行智能客服 POC', at: isoOffset(-3) },
  { id: 'a3', actor: '我', action: '状态变更', target: '任务 t6', detail: '待启动 → 已完成', at: isoOffset(0) },
]

// ── 示例数据：知识库 ──────────────────────────────────────────────
const sampleKnowledge = [
  {
    id: 'kb1',
    title: '智能客服 POC 验收标准模板',
    type: '产品规范',
    content:
      '一、解决率 ≥ 85%\n二、转人工率 ≤ 15%\n三、平均响应时长 < 3s\n四、敏感场景（退款/风控）必须命中人工兜底\n五、演示数据需覆盖退款、盗刷、限额、冻结四类场景，每类 ≥ 50 条。',
    tags: ['验收', 'POC', '客服'],
    fileIds: [],
    createdAt: isoOffset(-6),
    updatedAt: isoOffset(-6),
  },
  {
    id: 'kb2',
    title: '营销文案品牌调性指南',
    type: '业务文档',
    content:
      '品牌声量：年轻、有梗、克制不浮夸。\n禁止：夸张承诺、绝对化用语、医疗/保健暗示。\nA/B 变体：每主题至少 2 个角度（理性卖点 / 情绪共鸣）。\n平台差异：公众号偏长图文，小红书偏短文案+emoji。',
    tags: ['品牌', '文案', '营销'],
    fileIds: [],
    createdAt: isoOffset(-4),
    updatedAt: isoOffset(-4),
  },
]

// ── 示例数据：集成（MCP / 画板平台）──────────────────────────────
const sampleIntegrations = [
  {
    id: 'int-demo',
    name: '示例画板平台（Webhook）',
    type: 'webhook',
    endpoint: '',
    apiKey: '',
    enabled: false,
    description: '配置后，需求分析器可将生成的原型 HTML 与需求 JSON 推送到该地址，与业务侧画板平台对齐。',
    createdAt: isoOffset(-2),
  },
]

// ── 工作区隔离：每个工作区一份独立数据 ──────────────────────────────
function emptyWorkspaceData() {
  return {
    customers: [],
    requirements: [],
    tasks: [],
    projects: [],
    deals: [],
    meetings: [],
    messages: [],
    auditLog: [],
    knowledgeBase: [],
    files: [],
    integrations: [],
    llmConfig: { provider: 'deepseek', apiKey: '', model: 'deepseek-chat' },
    org: {
      members: [{ id: 'm-owner', name: '我', role: 'owner' }],
      currentMemberId: 'm-owner',
    },
    agentConfig: {
      confirmWrite: true,
      maxSteps: 20,
      timeoutMin: 10,
      failRetries: 1,
    },
  }
}

const defaultWorkspace = {
  id: 'ws-default',
  name: '我的工作区',
  pin: '',
  createdAt: isoOffset(0),
  data: {
    customers: sampleCustomers,
    requirements: sampleRequirements,
    tasks: sampleTasks,
    projects: sampleProjects,
    deals: sampleDeals,
    meetings: sampleMeetings,
    messages: [],
    auditLog: sampleAudit,
    knowledgeBase: sampleKnowledge,
    files: [],
    integrations: sampleIntegrations,
    llmConfig: { provider: 'deepseek', apiKey: '', model: 'deepseek-chat' },
    org: {
      members: [{ id: 'm-owner', name: '我', role: 'owner' }],
      currentMemberId: 'm-owner',
    },
    agentConfig: { confirmWrite: true, maxSteps: 20, timeoutMin: 10, failRetries: 1 },
  },
}

// 从完整 state 中抽取当前工作区活动数据
const pickLive = (s) => ({
  customers: s.customers,
  requirements: s.requirements,
  tasks: s.tasks,
  projects: s.projects,
  deals: s.deals,
  meetings: s.meetings,
  messages: s.messages,
  auditLog: s.auditLog,
  knowledgeBase: s.knowledgeBase,
  files: s.files,
  integrations: s.integrations,
  llmConfig: s.llmConfig,
  org: s.org,
  agentConfig: s.agentConfig,
})

const genId = (prefix) => `${prefix}${Date.now()}`

// ── 提示词模板（全局/跨工作区共享，可在「提示词管理」页编辑、恢复默认）──
// BUILTIN_PROMPTS 是代码内永不过时的内置值；用户编辑后写入 promptTemplates[].content
export const BUILTIN_PROMPTS = {
  intent_recognize: `你是一个企业业务管理智能助手（确认执行型）。用户会用自然语言下达指令，可能是创建任务/需求/客户/会议纪要，也可能是查询。
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
- 只输出 JSON，不要解释。`,

  requirement_analyze: `你是资深技术顾问与产品经理。请基于「需求 + 关联文件 + 知识库」评估该需求的可行性、实现难度与开发周期。
必须只输出 JSON，字段：feasible(可行|基本可行|高风险|暂不可行)、difficulty(低|中|高)、totalDays(整数人天)、
cycle(数组，每项{phase,days, note})、risks(字符串数组)、summary(一句话总评)、suggestion(推进建议)。
开发周期请拆为：需求澄清、方案设计、研发实现、测试验收、上线交付 五个阶段。`,

  requirement_chat: `你是需求分析助手。基于已给出的评估，回答用户追问，帮助判断是否继续推进。回答简洁、面向决策。`,

  prd_generate: `你是产品经理。基于需求与评估，输出一份结构化的 Markdown 需求文档（含背景、范围与验收标准、难度/周期、风险、参考知识库）。`,

  meeting_struct: `你是会议纪要整理助手。请把以下会议纪要做两件事：
1）整理为结构化的 HTML 笔记（允许使用 <p>/<ul>/<li>/<strong>/<h3>）；
2）提取其中的「待办 / 行动项（action items）」，每条包含 content（待办内容）、owner（负责人，无则为空）、deadline（截止日 YYYY-MM-DD，无则为空）。
只输出如下 JSON，不要任何解释：
{"html":"<结构化HTML>","todos":[{"content":"","owner":"","deadline":"","done":false}]}

原始纪要：
{{meeting_text}}`,

  report_generate: `你是一个工作复盘助手。用户会提供某个时间段内的任务清单（含客户、状态、优先级、标签）。
请生成一份结构化的工作报告，按 JSON 输出：
{
  "summary": "一句话总览（含任务总量与完成情况）",
  "completed": ["本周期已完成的事项（每条一句话）"],
  "inProgress": ["进行中事项"],
  "blockers": ["风险 / 阻塞 / 暂停事项（无则空数组）"],
  "customerSituation": ["客户维度情况（每条一个客户）"],
  "nextPlan": ["下个周期计划推进的事项"]
}
只输出 JSON，不要解释。`,

  task_analyze: `你是任务分析助手。请基于任务内容，给出：
- tags：从候选中选择最相关的 1-3 个（候选：Prompt调优 / 模型迭代 / 效果评测 / 工具集成 / 数据准备 / 问题修复 / 其他）
- priority：高 / 中 / 低
- taskType：prompt（偏提示词、模型、评测）或 feature（偏功能、集成、数据）
- summary：一句话任务理解与推进建议
只输出 JSON：{"tags":[],"priority":"","taskType":"","summary":""}`,

  task_decompose: `你是任务拆解助手。请基于给定任务（标题 / 标签 / 优先级 / 类型），拆解为 2-4 个可执行子任务。
只输出 JSON：{"subtasks":[{"title":"子任务标题","desc":"具体做法","hours":整数预估工时}]}`,

  daily_summary: `你是工作笔记总结助手。请基于笔记标题与正文，提炼关键结论 / 决策、待跟进事项、风险与阻塞点。
输出纯文本总结（3-5 句，分点用「•」）。可参考用户补充的反馈与上下文。
原始笔记：
{{note_text}}`,

  daily_priority: `你是任务优先级排序助手。请基于任务列表（含标题 / 优先级 / 状态 / 类型），给出合理执行顺序与理由。
只输出 JSON：{"order":["任务id数组，按推荐执行顺序"],"reasoning":"排序理由（3-5 句）"}`,
}

const PROMPT_META = [
  {
    key: 'intent_recognize',
    name: '智能助手 · 意图识别',
    group: '智能助手',
    scene: '确认执行型：将用户的自然语言指令解析为结构化执行计划（任务 / 需求 / 客户 / 会议纪要）。',
    variables: [{ name: '客户列表', desc: '运行时注入已知客户名称，用于关联归属' }],
  },
  {
    key: 'requirement_analyze',
    name: '需求 · 可行性评估',
    group: '需求分析',
    scene: '评估需求的可行性 / 难度 / 开发周期，输出结构化 JSON。',
    variables: [
      { name: '需求标题/描述/优先级', desc: '运行时拼接为 user 消息' },
      { name: '关联文件内容', desc: '运行时拼接（节选前 3 个文件）' },
      { name: '知识库条目', desc: '运行时按需求相关性检索 Top-K 注入（RAG）' },
    ],
  },
  {
    key: 'requirement_chat',
    name: '需求 · 对话追问',
    group: '需求分析',
    scene: '在初步评估基础上回答用户追问，辅助「继续 / 暂搁」决策。',
    variables: [
      { name: '背景 + 初步评估', desc: '作为 system 上下文注入' },
      { name: '对话历史', desc: '多轮 history 注入' },
    ],
  },
  {
    key: 'prd_generate',
    name: '需求 · 文档生成',
    group: '需求分析',
    scene: '基于需求与评估生成 Markdown 需求文档。',
    variables: [
      { name: '需求与评估', desc: '运行时拼接' },
      { name: '知识库', desc: '作为参考引用' },
    ],
  },
  {
    key: 'meeting_struct',
    name: '会议纪要 · 结构化',
    group: '文档总结',
    scene: '将会议纪要整理为结构化 HTML 并提取待办（JSON）。支持占位符 {{meeting_text}}。',
    variables: [{ name: '{{meeting_text}}', desc: '原始纪要纯文本，运行时替换' }],
  },
  {
    key: 'report_generate',
    name: '报告 · 周期复盘',
    group: '文档总结',
    scene: '基于周期任务清单生成周 / 月 / 年报 JSON。',
    variables: [{ name: '周期任务清单', desc: '运行时拼接为 user 消息' }],
  },
  {
    key: 'task_analyze',
    name: '任务 · 智能分析',
    group: '任务管理',
    scene: '分析任务内容，建议标签 / 优先级 / 类型与一句话推进建议。',
    variables: [{ name: '任务内容', desc: '运行时拼接为 user 消息' }],
  },
  {
    key: 'task_decompose',
    name: '任务 · 拆解子任务',
    group: '任务管理',
    scene: '将任务拆解为 2-4 个可执行子任务。',
    variables: [{ name: '任务信息', desc: '标题/标签/优先级/类型，运行时拼接' }],
  },
  {
    key: 'daily_summary',
    name: '笔记 · 智能总结',
    group: '文档总结',
    scene: '将工作笔记提炼为结论 / 待跟进 / 风险总结。支持占位符 {{note_text}}。',
    variables: [{ name: '{{note_text}}', desc: '笔记标题与正文，运行时替换' }],
  },
  {
    key: 'daily_priority',
    name: '任务 · 优先级排序',
    group: '任务管理',
    scene: '对任务列表给出推荐执行顺序与理由。',
    variables: [{ name: '任务列表', desc: '标题/优先级/状态/类型，运行时拼接' }],
  },
]

const buildPromptTemplates = () =>
  PROMPT_META.map((m) => ({ ...m, content: BUILTIN_PROMPTS[m.key] || '' }))

const useStore = create(
  persist(
    (set, get) => ({
      // 工作区注册表 + 当前活动工作区 + 解锁态
      workspaces: { [defaultWorkspace.id]: defaultWorkspace },
      activeWorkspaceId: defaultWorkspace.id,
      unlocked: false,

      // 登录态（不持久化，每次加载都展示登录页）
      loggedIn: false,
      currentUser: null,
      accounts: { admin: 'admin123', demo: 'demo' },

      // 活动工作区的「实时镜像」
      customers: defaultWorkspace.data.customers,
      requirements: defaultWorkspace.data.requirements,
      tasks: defaultWorkspace.data.tasks,
      projects: defaultWorkspace.data.projects,
      deals: defaultWorkspace.data.deals,
      meetings: defaultWorkspace.data.meetings,
      messages: defaultWorkspace.data.messages,
      auditLog: defaultWorkspace.data.auditLog,
      knowledgeBase: defaultWorkspace.data.knowledgeBase,
      files: defaultWorkspace.data.files,
      integrations: defaultWorkspace.data.integrations,
      llmConfig: defaultWorkspace.data.llmConfig,
      org: defaultWorkspace.data.org,
      agentConfig: defaultWorkspace.data.agentConfig,

      prefs: { notificationsEnabled: false },

      // 提示词模板（全局 / 跨工作区共享）
      promptTemplates: buildPromptTemplates(),

      // ── 审计辅助 ──
      pushAudit: (action, target, detail = '') =>
        set((state) => ({
          auditLog: [
            { id: genId('a'), actor: state.org.members.find((m) => m.id === state.org.currentMemberId)?.name || '我', action, target, detail, at: new Date().toISOString() },
            ...state.auditLog,
          ].slice(0, 500),
        })),

      // ── 消息辅助 ──
      pushMessage: (msg) =>
        set((state) => ({
          messages: [
            { id: genId('msg'), read: false, at: new Date().toISOString(), ...msg },
            ...state.messages,
          ].slice(0, 500),
        })),
      markMessageRead: (id) =>
        set((state) => ({ messages: state.messages.map((m) => (m.id === id ? { ...m, read: true } : m)) })),
      markAllMessagesRead: () => set((state) => ({ messages: state.messages.map((m) => ({ ...m, read: true })) })),

      // ── 工作区管理 ──
      unlockWorkspace: (id, pin = '') => {
        const ws = get().workspaces[id]
        if (!ws) return false
        if (ws.pin && ws.pin !== pin) return false
        set((state) => ({
          workspaces: {
            ...state.workspaces,
            [state.activeWorkspaceId]: { ...state.workspaces[state.activeWorkspaceId], data: pickLive(state) },
          },
          activeWorkspaceId: id,
          unlocked: true,
          ...ws.data,
        }))
        return true
      },
      switchWorkspace: (id) => {
        const ws = get().workspaces[id]
        if (!ws) return false
        set((state) => ({
          workspaces: {
            ...state.workspaces,
            [state.activeWorkspaceId]: { ...state.workspaces[state.activeWorkspaceId], data: pickLive(state) },
          },
          activeWorkspaceId: id,
          unlocked: true,
          ...ws.data,
        }))
        return true
      },
      lockWorkspace: () =>
        set((state) => ({
          workspaces: {
            ...state.workspaces,
            [state.activeWorkspaceId]: { ...state.workspaces[state.activeWorkspaceId], data: pickLive(state) },
          },
          unlocked: false,
        })),

      // ── 登录 / 登出 ──
      login: (username, password) => {
        const { accounts } = get()
        if (accounts[username] && accounts[username] === password) {
          set({ loggedIn: true, currentUser: username })
          return true
        }
        return false
      },
      registerAccount: (username, password) => {
        if (!username || !password) return false
        set((state) => ({ accounts: { ...state.accounts, [username]: password } }))
        set({ loggedIn: true, currentUser: username })
        return true
      },
      logout: () =>
        set((state) => ({
          workspaces: {
            ...state.workspaces,
            [state.activeWorkspaceId]: { ...state.workspaces[state.activeWorkspaceId], data: pickLive(state) },
          },
          loggedIn: false,
          currentUser: null,
          unlocked: false,
        })),
      createWorkspace: (name, pin = '') => {
        const id = `ws-${Date.now()}`
        set((state) => {
          const data = emptyWorkspaceData()
          return {
            workspaces: {
              ...state.workspaces,
              [state.activeWorkspaceId]: { ...state.workspaces[state.activeWorkspaceId], data: pickLive(state) },
              [id]: { id, name: name || '新工作区', pin, createdAt: new Date().toISOString(), data },
            },
            activeWorkspaceId: id,
            unlocked: true,
            ...data,
          }
        })
        return id
      },
      renameWorkspace: (id, name) =>
        set((state) => ({ workspaces: { ...state.workspaces, [id]: { ...state.workspaces[id], name } } })),
      updateWorkspacePin: (id, pin) =>
        set((state) => ({ workspaces: { ...state.workspaces, [id]: { ...state.workspaces[id], pin } } })),
      deleteWorkspace: (id) => {
        const { workspaces, activeWorkspaceId } = get()
        if (Object.keys(workspaces).length <= 1) return false
        const rest = { ...workspaces }
        delete rest[id]
        const nextId = id === activeWorkspaceId ? Object.keys(rest)[0] : activeWorkspaceId
        set((state) => ({
          workspaces: rest,
          activeWorkspaceId: nextId,
          unlocked: id === activeWorkspaceId ? true : state.unlocked,
          ...(id === activeWorkspaceId ? rest[nextId].data : {}),
        }))
        return true
      },

      // ── 组织架构 / 成员 ──
      addMember: (name, role = 'member') => {
        set((state) => ({
          org: { ...state.org, members: [...state.org.members, { id: `m-${Date.now()}`, name, role }] },
        }))
        get().pushAudit('新增', `成员 ${name}`, `角色：${role}`)
      },
      updateMember: (id, updates) =>
        set((state) => ({
          org: { ...state.org, members: state.org.members.map((m) => (m.id === id ? { ...m, ...updates } : m)) },
        })),
      removeMember: (id) => {
        const member = get().org.members.find((m) => m.id === id)
        set((state) => {
          const members = state.org.members.filter((m) => m.id !== id)
          const currentMemberId =
            state.org.currentMemberId === id
              ? (members.find((m) => m.role === 'owner') || members[0])?.id
              : state.org.currentMemberId
          return { org: { ...state.org, members, currentMemberId } }
        })
        if (member) get().pushAudit('删除', `成员 ${member.name}`)
      },
      setCurrentMember: (id) => set((state) => ({ org: { ...state.org, currentMemberId: id } })),

      // ── Customer actions ──
      addCustomer: (customer) => {
        const id = genId('c')
        set((state) => ({
          customers: [
            ...state.customers,
            {
              ...customer,
              id,
              ownerId: state.org.currentMemberId,
              status: customer.status || '初步接触',
              createdAt: new Date().toISOString(),
            },
          ],
        }))
        get().pushAudit('创建', `客户 ${customer.name || id}`, '')
        get().pushMessage({ type: '系统', level: 'P2', title: '新建客户', body: customer.name || id, link: '/customers' })
        return id
      },
      updateCustomer: (id, updates) => {
        set((state) => ({
          customers: state.customers.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        }))
        if (updates.status) get().pushAudit('状态变更', `客户 ${id}`, updates.status)
      },
      deleteCustomer: (id) =>
        set((state) => ({
          customers: state.customers.filter((c) => c.id !== id),
          tasks: state.tasks.filter((t) => t.customerId !== id),
          requirements: state.requirements.filter((r) => r.customerId !== id),
        })),

      // ── Requirement actions ──
      addRequirement: (req) => {
        const id = genId('r')
        const ts = new Date().toISOString()
        set((state) => ({
          requirements: [
            ...state.requirements,
            {
              ...req,
              id,
              ownerId: state.org.currentMemberId,
              status: req.status || '待评审',
              createdAt: ts,
              updatedAt: ts,
              statusHistory: [{ status: req.status || '待评审', at: ts }],
              relatedTaskIds: req.relatedTaskIds || [],
            },
          ],
        }))
        get().pushAudit('创建', `需求 ${req.title || id}`, '')
        get().pushMessage({ type: '进度', level: 'P2', title: '新建需求', body: req.title || id, link: '/requirements' })
        return id
      },
      updateRequirement: (id, updates) => {
        set((state) => ({
          requirements: state.requirements.map((r) => {
            if (r.id !== id) return r
            const ts = new Date().toISOString()
            const statusChanged = updates.status && updates.status !== r.status
            const history = statusChanged ? [...(r.statusHistory || []), { status: updates.status, at: ts }] : r.statusHistory
            return { ...r, ...updates, updatedAt: ts, statusHistory: history }
          }),
        }))
        if (updates.status) get().pushAudit('状态变更', `需求 ${id}`, updates.status)
      },
      deleteRequirement: (id) =>
        set((state) => ({ requirements: state.requirements.filter((r) => r.id !== id) })),
      // 需求拆解为任务（批量）
      decomposeRequirement: (requirementId, tasks) => {
        const req = get().requirements.find((r) => r.id === requirementId)
        const created = tasks.map((t) => {
          const ts = new Date().toISOString()
          return {
            ...t,
            id: genId('t'),
            requirementId,
            customerId: req?.customerId || t.customerId || null,
            ownerId: get().org.currentMemberId,
            createdAt: ts,
            updatedAt: ts,
            statusHistory: [{ status: t.status || '待启动', at: ts }],
          }
        })
        set((state) => ({
          tasks: [...state.tasks, ...created],
          requirements: state.requirements.map((r) =>
            r.id === requirementId
              ? { ...r, status: '已采纳', relatedTaskIds: [...(r.relatedTaskIds || []), ...created.map((t) => t.id)] }
              : r
          ),
        }))
        get().pushAudit('拆解', `需求 ${requirementId}`, `生成 ${created.length} 个任务`)
        get().pushMessage({ type: '进度', level: 'P2', title: '需求已拆解', body: `生成 ${created.length} 个任务`, link: '/tasks' })
        return created
      },

      // ── Task actions ──
      addTask: (task) => {
        const id = genId('t')
        const ts = new Date().toISOString()
        set((state) => ({
          tasks: [
            ...state.tasks,
            {
              ...task,
              id,
              ownerId: state.org.currentMemberId,
              createdAt: ts,
              updatedAt: ts,
              statusHistory: [{ status: task.status || '待启动', at: ts }],
            },
          ],
        }))
        get().pushAudit('创建', `任务 ${task.title || id}`, '')
        return id
      },
      addTasks: (newTasks) => {
        const created = newTasks.map((t) => {
          const ts = new Date().toISOString()
          return {
            ...t,
            id: genId('t'),
            ownerId: get().org.currentMemberId,
            createdAt: ts,
            updatedAt: ts,
            statusHistory: [{ status: t.status || '待启动', at: ts }],
          }
        })
        set((state) => ({ tasks: [...state.tasks, ...created] }))
        get().pushAudit('批量创建', `任务`, `${created.length} 条`)
        return created
      },
      updateTask: (id, updates) => {
        set((state) => ({
          tasks: state.tasks.map((t) => {
            if (t.id !== id) return t
            const ts = new Date().toISOString()
            const statusChanged = updates.status && updates.status !== t.status
            const history = statusChanged
              ? [...(t.statusHistory || []), { status: updates.status, at: ts }]
              : t.statusHistory || []
            return { ...t, ...updates, updatedAt: ts, statusHistory: history }
          }),
        }))
        if (updates.status) {
          get().pushAudit('状态变更', `任务 ${id}`, updates.status)
          get().pushMessage({ type: '进度', level: 'P2', title: '任务状态变更', body: `${id} → ${updates.status}`, link: '/tasks' })
        }
      },
      deleteTask: (id) => set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) })),

      // ── Project actions ──
      addProject: (project) => {
        const id = genId('p')
        set((state) => ({
          projects: [
            ...state.projects,
            {
              ...project,
              id,
              ownerId: state.org.currentMemberId,
              status: project.status || '规划中',
              members: project.members || [state.org.currentMemberId],
              milestones: project.milestones || [],
              riskLevel: project.riskLevel || '低',
              createdAt: new Date().toISOString(),
            },
          ],
        }))
        get().pushAudit('创建', `项目 ${project.name || id}`, '')
        return id
      },
      updateProject: (id, updates) =>
        set((state) => ({ projects: state.projects.map((p) => (p.id === id ? { ...p, ...updates } : p)) })),
      deleteProject: (id) => set((state) => ({ projects: state.projects.filter((p) => p.id !== id) })),

      // ── Deal actions ──
      addDeal: (deal) => {
        const id = genId('d')
        set((state) => ({
          deals: [
            ...state.deals,
            { ...deal, id, ownerId: state.org.currentMemberId, status: deal.status || '进行中', createdAt: new Date().toISOString() },
          ],
        }))
        get().pushAudit('创建', `成单 ${deal.name || id}`, '')
        return id
      },
      updateDeal: (id, updates) =>
        set((state) => ({ deals: state.deals.map((d) => (d.id === id ? { ...d, ...updates } : d)) })),
      deleteDeal: (id) => set((state) => ({ deals: state.deals.filter((d) => d.id !== id) })),

      // ── Meeting actions ──
      addMeeting: (meeting) => {
        const id = genId('mt')
        set((state) => ({
          meetings: [
            ...state.meetings,
            { ...meeting, id, createdAt: new Date().toISOString() },
          ],
        }))
        get().pushAudit('创建', `会议纪要 ${meeting.title || id}`, '')
        return id
      },
      updateMeeting: (id, updates) =>
        set((state) => ({ meetings: state.meetings.map((m) => (m.id === id ? { ...m, ...updates } : m)) })),
      deleteMeeting: (id) => set((state) => ({ meetings: state.meetings.filter((m) => m.id !== id) })),
      // 会议纪要待办转任务
      todosToTasks: (meetingId, todos) => {
        const meeting = get().meetings.find((m) => m.id === meetingId)
        const customerId = meeting?.relatedCustomerIds?.[0] || null
        const created = todos
          .filter((t) => !t.done && t.content)
          .map((t) => {
            const ts = new Date().toISOString()
            return {
              title: t.content,
              content: `来自会议纪要「${meeting?.title || ''}」的待办`,
              customerId,
              ownerId: t.owner ? get().org.currentMemberId : get().org.currentMemberId,
              priority: '中',
              status: '待启动',
              source: '会议记录',
              deadline: t.deadline || '',
              scheduledDate: t.deadline || '',
              tags: ['会议待办'],
              createdAt: ts,
              updatedAt: ts,
              statusHistory: [{ status: '待启动', at: ts }],
            }
          })
        if (!created.length) return []
        set((state) => ({ tasks: [...state.tasks, ...created] }))
        get().pushAudit('待办转任务', `会议纪要 ${meetingId}`, `${created.length} 条`)
        get().pushMessage({ type: '进度', level: 'P2', title: '会议待办已转任务', body: `${created.length} 条`, link: '/tasks' })
        return created
      },

      // ── 知识库 actions ──
      addKnowledge: (kb) => {
        const id = genId('kb')
        const ts = new Date().toISOString()
        set((state) => ({
          knowledgeBase: [{ ...kb, id, fileIds: kb.fileIds || [], createdAt: ts, updatedAt: ts }, ...state.knowledgeBase],
        }))
        get().pushAudit('创建', `知识库 ${kb.title || id}`, '')
        return id
      },
      updateKnowledge: (id, updates) =>
        set((state) => ({
          knowledgeBase: state.knowledgeBase.map((k) =>
            k.id === id ? { ...k, ...updates, updatedAt: new Date().toISOString() } : k
          ),
        })),
      deleteKnowledge: (id) =>
        set((state) => ({ knowledgeBase: state.knowledgeBase.filter((k) => k.id !== id) })),

      // ── 文件元数据 actions（blob 存 IndexedDB，见 utils/fileStore）──
      addFileMeta: (meta) =>
        set((state) => ({
          files: [{ ...meta, createdAt: new Date().toISOString() }, ...state.files],
        })),
      removeFileMeta: (id) =>
        set((state) => ({
          files: state.files.filter((f) => f.id !== id),
          requirements: state.requirements.map((r) =>
            r.fileIds?.includes(id) ? { ...r, fileIds: r.fileIds.filter((x) => x !== id) } : r
          ),
          knowledgeBase: state.knowledgeBase.map((k) =>
            k.fileIds?.includes(id) ? { ...k, fileIds: k.fileIds.filter((x) => x !== id) } : k
          ),
        })),

      // ── 集成（MCP / 画板平台）actions ──
      addIntegration: (it) => {
        const id = genId('int')
        set((state) => ({
          integrations: [{ ...it, id, createdAt: new Date().toISOString() }, ...state.integrations],
        }))
        get().pushAudit('创建', `集成 ${it.name || id}`, '')
        return id
      },
      updateIntegration: (id, updates) =>
        set((state) => ({
          integrations: state.integrations.map((i) => (i.id === id ? { ...i, ...updates } : i)),
        })),
      deleteIntegration: (id) =>
        set((state) => ({ integrations: state.integrations.filter((i) => i.id !== id) })),

      // ── LLM config ──
      updateLlmConfig: (updates) => set((state) => ({ llmConfig: { ...state.llmConfig, ...updates } })),

      // ── Agent 管控配置 ──
      updateAgentConfig: (updates) =>
        set((state) => ({ agentConfig: { ...state.agentConfig, ...updates } })),

      // ── 偏好 ──
      updatePrefs: (updates) => set((state) => ({ prefs: { ...state.prefs, ...updates } })),

      // ── 提示词模板（从「提示词管理」页读写）──
      getPrompt: (key) => {
        const t = get().promptTemplates.find((p) => p.key === key)
        if (t && t.content && t.content.trim()) return t.content
        return BUILTIN_PROMPTS[key] || ''
      },
      savePrompt: (key, content) =>
        set((state) => ({
          promptTemplates: state.promptTemplates.map((p) => (p.key === key ? { ...p, content } : p)),
        })),
      resetPrompt: (key) =>
        set((state) => ({
          promptTemplates: state.promptTemplates.map((p) => (p.key === key ? { ...p, content: BUILTIN_PROMPTS[key] || '' } : p)),
        })),
    }),
    {
      name: 'work-agent-sync-v5',
      partialize: (state) => {
        const rest = { ...state }
        delete rest.loggedIn
        delete rest.currentUser
        return rest
      },
    }
  )
)

// 迁移：确保持久化数据包含新增的提示词模板（如 task_analyze / task_decompose / daily_summary / daily_priority）
;(() => {
  try {
    const st = useStore.getState()
    const missing = PROMPT_META.filter((m) => !st.promptTemplates.some((p) => p.key === m.key))
    if (missing.length) {
      useStore.setState({
        promptTemplates: [
          ...st.promptTemplates,
          ...missing.map((m) => ({ ...m, content: BUILTIN_PROMPTS[m.key] || '' })),
        ],
      })
    }
  } catch {
    /* 忽略迁移异常 */
  }
})()

export default useStore
