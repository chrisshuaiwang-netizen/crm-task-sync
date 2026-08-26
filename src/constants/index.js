/**
 * 全局常量 — Agent 智能业务管理系统
 * 收口所有类型/状态/标签/颜色定义，供各页面统一引用
 */

// ── 客户行业 ─────────────────────────────────────────────────────────
export const CUSTOMER_INDUSTRIES = [
  '金融',
  '零售电商',
  '制造',
  '医疗健康',
  '教育',
  '企业服务',
  '政企',
  '其他',
]

export const INDUSTRY_COLORS = {
  金融: 'bg-blue-100 text-blue-700',
  零售电商: 'bg-orange-100 text-orange-700',
  制造: 'bg-teal-100 text-teal-700',
  医疗健康: 'bg-rose-100 text-rose-700',
  教育: 'bg-indigo-100 text-indigo-700',
  企业服务: 'bg-purple-100 text-purple-700',
  政企: 'bg-cyan-100 text-cyan-700',
  其他: 'bg-slate-100 text-slate-600',
}

// ── 客户状态机（PRD：初步接触/需求沟通/方案输出/商务谈判/已成单/已流失）──
export const CUSTOMER_STATUSES = ['初步接触', '需求沟通', '方案输出', '商务谈判', '已成单', '已流失']
export const CUSTOMER_STATUS_COLORS = {
  初步接触: 'bg-slate-100 text-slate-600',
  需求沟通: 'bg-sky-100 text-sky-700',
  方案输出: 'bg-indigo-100 text-indigo-700',
  商务谈判: 'bg-amber-100 text-amber-700',
  已成单: 'bg-green-100 text-green-700',
  已流失: 'bg-red-100 text-red-600',
}

// ── 优先级 ─────────────────────────────────────────────────────────
export const PRIORITY_BADGE = {
  高: 'bg-red-100 text-red-700 border border-red-200',
  中: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
  低: 'bg-green-100 text-green-700 border border-green-200',
}
export const PRIORITY_DOT = { 高: 'bg-red-500', 中: 'bg-yellow-500', 低: 'bg-green-500' }
export const PRIORITY_ORDER = { 高: 0, 中: 1, 低: 2 }
export const PRIORITY_WEIGHT = { 高: 3, 中: 2, 低: 1 }

// ── 任务状态（客户工作语境，5 态）──────────────────────────────────
export const TASK_STATUSES = ['待启动', '进行中', '已完成', '已暂停', '已取消']
export const STATUS_CONFIG = {
  待启动: { badge: 'bg-slate-100 text-slate-500', dot: 'bg-slate-300', progress: 0 },
  进行中: { badge: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500', progress: 50 },
  已完成: { badge: 'bg-green-100 text-green-700', dot: 'bg-green-500', progress: 100 },
  已暂停: { badge: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400', progress: 50 },
  已取消: { badge: 'bg-red-100 text-red-600', dot: 'bg-red-400', progress: 0 },
}
export const STATUS_ORDER = { 待启动: 0, 进行中: 1, 已完成: 2, 已暂停: 3, 已取消: 4 }
export const ALL_STATUSES = ['全部', ...TASK_STATUSES]
export const statusToProgress = (status) => STATUS_CONFIG[status]?.progress ?? 0
export const SCHEDULE_PENDING_STATUS = '待启动'
export const SCHEDULE_ACTIVE_STATUS = '进行中'
export const ACTIVE_STATUSES = ['进行中']

// ── 需求状态机（PRD：需求拆解 5 阶段 + 评审/采纳/暂停/拒绝）─────────
export const REQUIREMENT_STATUSES = ['待评审', '已采纳', '设计中', '开发中', '测试中', '已上线', '已暂停', '已拒绝']
export const REQUIREMENT_STATUS_COLORS = {
  待评审: 'bg-slate-100 text-slate-600',
  已采纳: 'bg-violet-100 text-violet-700',
  设计中: 'bg-indigo-100 text-indigo-700',
  开发中: 'bg-blue-100 text-blue-700',
  测试中: 'bg-cyan-100 text-cyan-700',
  已上线: 'bg-green-100 text-green-700',
  已暂停: 'bg-gray-100 text-gray-600',
  已拒绝: 'bg-red-100 text-red-600',
}
export const REQUIREMENT_ORDER = { 待评审: 0, 已采纳: 1, 设计中: 2, 开发中: 3, 测试中: 4, 已上线: 5, 已暂停: 6, 已拒绝: 7 }

// ── 需求标签 ──────────────────────────────────────────────────────
export const REQUIREMENT_TAGS = ['新需求', '功能优化', '数据需求', 'Bug修复', '体验优化', '性能优化']
export const REQUIREMENT_TAG_COLORS = {
  新需求: 'bg-purple-100 text-purple-700',
  功能优化: 'bg-blue-100 text-blue-700',
  数据需求: 'bg-teal-100 text-teal-700',
  Bug修复: 'bg-red-100 text-red-700',
  体验优化: 'bg-orange-100 text-orange-700',
  性能优化: 'bg-emerald-100 text-emerald-700',
}

// ── 任务标签（客户工作语境）─────────────────────────────────────────
export const TAG_COLORS = {
  客户跟进: 'bg-blue-100 text-blue-700',
  需求处理: 'bg-purple-100 text-purple-700',
  问题修复: 'bg-red-100 text-red-700',
  方案设计: 'bg-indigo-100 text-indigo-700',
  商务沟通: 'bg-orange-100 text-orange-700',
  数据复盘: 'bg-teal-100 text-teal-700',
  内部协同: 'bg-slate-100 text-slate-600',
  会议待办: 'bg-pink-100 text-pink-700',
}
export const ALL_TAGS = Object.keys(TAG_COLORS)

// ── 任务来源 ───────────────────────────────────────────────────────
export const TASK_SOURCES = ['客户反馈', '会议记录', '产品规划', '领导交办', '主动发现', '其他']

// ── 项目状态 ──────────────────────────────────────────────────────
export const PROJECT_STATUSES = ['规划中', '进行中', '已延期', '已上线', '已暂停']
export const PROJECT_STATUS_COLORS = {
  规划中: 'bg-slate-100 text-slate-600',
  进行中: 'bg-blue-100 text-blue-700',
  已延期: 'bg-red-100 text-red-700',
  已上线: 'bg-green-100 text-green-700',
  已暂停: 'bg-gray-100 text-gray-600',
}
export const PROJECT_RISK = { 高: 'bg-red-100 text-red-700', 中: 'bg-amber-100 text-amber-700', 低: 'bg-green-100 text-green-700' }

// ── 成单阶段 ──────────────────────────────────────────────────────
export const DEAL_STAGES = ['初步接触', '方案报价', '商务谈判', '合同评审', '已成交', '已流失']
export const DEAL_STAGE_COLORS = {
  初步接触: 'bg-slate-100 text-slate-600',
  方案报价: 'bg-sky-100 text-sky-700',
  商务谈判: 'bg-amber-100 text-amber-700',
  合同评审: 'bg-violet-100 text-violet-700',
  已成交: 'bg-green-100 text-green-700',
  已流失: 'bg-red-100 text-red-600',
}

// ── 会议纪要分类 ───────────────────────────────────────────────────
export const MEETING_CATEGORIES = ['评审会', '客户会', '周会', '站会', '其他']

// ── 消息类型 / 等级 ───────────────────────────────────────────────
export const MESSAGE_TYPES = ['审批', '预警', '进度', '报告', '系统']
export const MESSAGE_LEVELS = {
  P0: { label: '紧急', color: 'bg-red-500' },
  P1: { label: '重要', color: 'bg-amber-500' },
  P2: { label: '普通', color: 'bg-slate-400' },
}

// ── Agent 子角色（PRD 中枢层）──────────────────────────────────────
export const AGENT_SUBROLES = [
  { key: 'master', name: '总控 Agent', desc: '意图识别、任务拆解、调度与汇总' },
  { key: 'crm', name: 'CRM 子 Agent', desc: '客户管理、成单统计' },
  { key: 'task', name: '任务管理子 Agent', desc: '需求、任务、项目进度' },
  { key: 'doc', name: '文档总结子 Agent', desc: '日报、周报、会议纪要' },
  { key: 'report', name: '报表分析子 Agent', desc: '数据统计、多维度分析' },
]

// ── LLM 模型商（OpenAI 兼容接口，前端直连）─────────────────────────
export const LLM_PROVIDERS = [
  {
    id: 'deepseek',
    name: 'DeepSeek',
    baseURL: 'https://api.deepseek.com/v1',
    models: ['deepseek-chat', 'deepseek-reasoner'],
    defaultModel: 'deepseek-chat',
    placeholder: 'sk-...',
    doc: 'https://platform.deepseek.com/api_keys',
  },
  {
    id: 'qwen',
    name: '通义千问',
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    models: ['qwen-plus', 'qwen-max', 'qwen-turbo'],
    defaultModel: 'qwen-plus',
    placeholder: 'sk-...',
    doc: 'https://help.aliyun.com/zh/model-studio/',
  },
  {
    id: 'doubao',
    name: '豆包',
    baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
    models: ['doubao-seed-1-6-250615', 'doubao-pro-32k'],
    defaultModel: 'doubao-seed-1-6-250615',
    placeholder: '你的 Ark API Key',
    doc: 'https://console.volcengine.com/ark',
  },
]
export const getProvider = (id) => LLM_PROVIDERS.find((p) => p.id === id) || LLM_PROVIDERS[0]

// ── 组织架构 / 角色权限（本地多工作区隔离）──────────────────────────
export const ROLES = {
  owner: {
    key: 'owner',
    name: '管理员',
    desc: '拥有全部权限：看所有数据、管理成员与客户、配置系统',
    permissions: { viewScope: 'all', canEdit: true, canManageMembers: true, canManageCustomers: true, canManageSystem: true },
  },
  member: {
    key: 'member',
    name: '成员',
    desc: '可编辑任务，仅看自己负责的数据，不能管理成员/客户/系统',
    permissions: { viewScope: 'mine', canEdit: true, canManageMembers: false, canManageCustomers: false, canManageSystem: false },
  },
  guest: {
    key: 'guest',
    name: '访客',
    desc: '只读，仅看自己负责的数据',
    permissions: { viewScope: 'mine', canEdit: false, canManageMembers: false, canManageCustomers: false, canManageSystem: false },
  },
}
export const ROLE_KEYS = Object.keys(ROLES)

export function getPermissions(workspace) {
  if (!workspace?.org) return ROLES.member.permissions
  const member = workspace.org.members.find((m) => m.id === workspace.org.currentMemberId)
  const role = ROLES[member?.role] || ROLES.member
  return role.permissions
}

export function filterByVisibility(items, workspace, getOwnerId) {
  const perms = getPermissions(workspace)
  if (perms.viewScope === 'all') return items
  const me = workspace?.org?.currentMemberId
  return items.filter((it) => {
    const oid = getOwnerId(it)
    return !oid || oid === me
  })
}

// ── 知识库类型 ─────────────────────────────────────────────────────
export const KNOWLEDGE_TYPES = ['产品规范', '业务文档', '竞品分析', '技术笔记', '网页收藏', '其他']
export const KNOWLEDGE_TYPE_COLORS = {
  产品规范: 'bg-blue-100 text-blue-700',
  业务文档: 'bg-green-100 text-green-700',
  竞品分析: 'bg-purple-100 text-purple-700',
  技术笔记: 'bg-amber-100 text-amber-700',
  网页收藏: 'bg-cyan-100 text-cyan-700',
  其他: 'bg-slate-100 text-slate-600',
}

// ── 文件来源（关联到哪类实体）──────────────────────────────────────
export const FILE_SOURCES = {
  requirement: '需求附件',
  knowledge: '知识库',
  general: '通用上传',
}
export const FILE_SOURCE_COLORS = {
  requirement: 'bg-blue-100 text-blue-700',
  knowledge: 'bg-green-100 text-green-700',
  general: 'bg-slate-100 text-slate-600',
}

// ── 集成类型（MCP / 画 demo 平台）─────────────────────────────────
export const INTEGRATION_TYPES = [
  { id: 'mcp', label: 'MCP 服务', desc: '标准 MCP Server，用于工具调用 / 画板生成' },
  { id: 'demo-platform', label: '画 Demo 平台', desc: '如 Figma / 墨刀 / 即时 AI 等原型平台（通过 Webhook / API）' },
  { id: 'webhook', label: '通用 Webhook', desc: '自定义 HTTP 接口，接收原型与需求 JSON' },
]
export const INTEGRATION_TYPE_LABELS = INTEGRATION_TYPES.reduce((m, t) => ({ ...m, [t.id]: t.label }), {})

// ── 需求分析：难度 / 可行性配色 ───────────────────────────────────
export const DIFFICULTY_COLORS = {
  低: 'bg-green-100 text-green-700',
  中: 'bg-amber-100 text-amber-700',
  高: 'bg-red-100 text-red-700',
}
export const FEASIBILITY_COLORS = {
  可行: 'bg-green-100 text-green-700',
  基本可行: 'bg-amber-100 text-amber-700',
  高风险: 'bg-red-100 text-red-700',
  暂不可行: 'bg-slate-200 text-slate-500',
}

// 可被文本预览的文件类型
export const TEXT_PREVIEW_EXT = ['txt', 'md', 'markdown', 'csv', 'json', 'js', 'ts', 'tsx', 'jsx', 'py', 'java', 'go', 'yml', 'yaml', 'xml', 'html', 'css', 'log']
