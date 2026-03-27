import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const sampleCustomers = [
  {
    id: 'c1',
    name: '北京云信科技有限公司',
    industry: '金融科技',
    priority: '高',
    contact: '张伟',
    phone: '138-0010-1234',
    notes: '核心大客户，年度合同金额500万，重点维护。对接人是张总，决策周期较短，反馈及时。',
    productCategory: 'DAM',
    createdAt: '2024-09-15T08:00:00Z',
  },
  {
    id: 'c2',
    name: '上海慧联数据服务',
    industry: '大数据',
    priority: '高',
    contact: '李晓燕',
    phone: '139-2100-5678',
    notes: '数据中台项目重点客户，目前处于二期开发阶段，需关注数据安全合规需求。',
    productCategory: '开放平台-国内标准版',
    createdAt: '2024-10-03T09:30:00Z',
  },
  {
    id: 'c3',
    name: '广州新零售集团',
    industry: '零售电商',
    priority: '中',
    contact: '陈建国',
    phone: '137-5566-9900',
    notes: '电商平台客户，主要需求集中在用户增长和转化率优化。季度性需求较多。',
    productCategory: '开放平台-海外标准版',
    createdAt: '2024-11-20T10:00:00Z',
  },
  {
    id: 'c4',
    name: '深圳智运物流科技',
    industry: '物流科技',
    priority: '低',
    contact: '王芳',
    phone: '136-7788-2233',
    notes: '中小型物流客户，需求以系统稳定性和小功能优化为主，响应周期可适当延长。',
    productCategory: '私有化部署',
    createdAt: '2025-01-08T11:00:00Z',
  },
]

const sampleRequirements = [
  {
    id: 'r1',
    title: '报表导出功能支持Excel格式',
    content: '目前系统只支持CSV格式导出，客户反映财务同学无法直接使用，强烈要求支持Excel（.xlsx）格式。这是紧急需求，影响月底财务对账流程，请尽快安排开发。',
    customerId: 'c1',
    productCategory: 'DAM',
    tags: ['功能优化', '数据需求'],
    priority: '高',
    status: '开发中',
    source: '微信',
    createdAt: '2025-03-10T09:15:00Z',
    deadline: '2025-03-31',
    aiSummary: '客户需要将报表导出格式从CSV升级为Excel。建议优先排期，影响财务月结流程。',
  },
  {
    id: 'r2',
    title: '用户权限管理模块优化',
    content: '现有权限系统过于简单，只有管理员和普通用户两种角色。客户需要支持自定义角色、菜单级别权限控制，以及数据行级别权限（不同销售只能看到自己负责的客户数据）。',
    customerId: 'c1',
    productCategory: 'DAM',
    tags: ['新需求', '功能优化'],
    priority: '高',
    status: '待评审',
    source: '会议',
    createdAt: '2025-03-18T14:00:00Z',
    deadline: '2025-04-30',
    aiSummary: '需要升级权限管理体系，涉及角色管理、菜单权限和数据权限三个层面。',
  },
  {
    id: 'r3',
    title: '数据看板实时刷新问题',
    content: '数据大屏在高并发情况下会出现数据不刷新或者显示旧数据的问题，客户演示时多次出现，影响很大。排查后初步判断是缓存策略问题，需要修复。',
    customerId: 'c2',
    productCategory: '开放平台-国内标准版',
    tags: ['Bug修复'],
    priority: '高',
    status: '开发中',
    source: '电话',
    createdAt: '2025-03-20T10:30:00Z',
    deadline: '2025-03-28',
    aiSummary: '数据看板缓存Bug导致高并发下显示旧数据，需紧急修复缓存策略。',
  },
  {
    id: 'r4',
    title: '小程序首页加载速度优化',
    content: '用户反馈小程序首页打开慢，有时需要3-5秒才能显示内容。通过分析发现首屏请求了大量非必要接口，图片也没有做懒加载和压缩。希望优化到1.5秒以内。',
    customerId: 'c3',
    productCategory: '开放平台-海外标准版',
    tags: ['体验优化'],
    priority: '中',
    status: '待评审',
    source: '邮件',
    createdAt: '2025-03-22T15:00:00Z',
    deadline: '2025-04-15',
    aiSummary: '小程序首页性能问题，需优化接口调用策略和图片加载方式，目标加载时间降至1.5秒。',
  },
  {
    id: 'r5',
    title: '物流轨迹地图展示功能',
    content: '希望在订单详情页增加货物实时位置地图展示，使用高德地图API，展示当前位置、历史轨迹和预计到达时间。这是新功能，客户希望下季度上线。',
    customerId: 'c4',
    productCategory: '私有化部署',
    tags: ['新需求'],
    priority: '低',
    status: '待评审',
    source: '会议',
    createdAt: '2025-03-25T11:00:00Z',
    deadline: '2025-06-30',
    aiSummary: '新增物流轨迹地图功能，接入高德地图API展示实时位置和历史轨迹。',
  },
  {
    id: 'r6',
    title: '批量导入客户数据支持',
    content: '目前每次新增客户需要手动一条条录入，客户有大量历史数据需要迁移，强烈要求支持Excel模板批量导入功能，包括数据校验和错误提示。',
    customerId: 'c2',
    productCategory: '开放平台-国内标准版',
    tags: ['功能优化', '数据需求'],
    priority: '中',
    status: '已上线',
    source: '微信',
    createdAt: '2025-02-15T09:00:00Z',
    deadline: '2025-03-10',
    aiSummary: '批量导入功能已上线，支持Excel模板导入客户数据，含数据校验逻辑。',
  },
]

const today = new Date()
const todayStr = today.toISOString().split('T')[0]
const yesterday = new Date(today)
yesterday.setDate(today.getDate() - 1)
const yesterdayStr = yesterday.toISOString().split('T')[0]
const tomorrow = new Date(today)
tomorrow.setDate(today.getDate() + 1)
const tomorrowStr = tomorrow.toISOString().split('T')[0]

const sampleTasks = [
  {
    id: 't1',
    title: '与云信科技技术团队评审权限需求方案',
    desc: '准备需求评审PPT，邀请前后端架构师参与，明确开发范围和技术方案，输出评审纪要。',
    requirementId: 'r2',
    customerId: 'c1',
    date: todayStr,
    hours: 2,
    status: '进行中',
    priority: '高',
  },
  {
    id: 't2',
    title: '跟进数据看板Bug修复进度',
    desc: '联系开发同学了解缓存问题修复方案，确认测试环境验证结果，同步给慧联数据客户。',
    requirementId: 'r3',
    customerId: 'c2',
    date: todayStr,
    hours: 1,
    status: '待处理',
    priority: '高',
  },
  {
    id: 't3',
    title: '输出小程序性能优化方案文档',
    desc: '梳理首屏接口调用优化策略，图片懒加载方案，写成技术方案文档交给开发团队评审。',
    requirementId: 'r4',
    customerId: 'c3',
    date: todayStr,
    hours: 3,
    status: '待处理',
    priority: '中',
  },
  {
    id: 't4',
    title: '整理本周需求优先级并同步研发负责人',
    desc: '汇总本周所有待处理需求，按优先级排序，与研发负责人对齐排期计划，确认资源分配。',
    requirementId: null,
    customerId: null,
    date: todayStr,
    hours: 1,
    status: '待处理',
    priority: '中',
  },
  {
    id: 't5',
    title: 'Excel导出功能上线前验收测试',
    desc: '对报表导出Excel功能进行全面测试，覆盖不同数据量、特殊字符、格式样式等场景，提交测试报告。',
    requirementId: 'r1',
    customerId: 'c1',
    date: yesterdayStr,
    hours: 2,
    status: '已完成',
    priority: '高',
  },
]

const useStore = create(
  persist(
    (set) => ({
      customers: sampleCustomers,
      requirements: sampleRequirements,
      tasks: sampleTasks,

      // Customer actions
      addCustomer: (customer) =>
        set((state) => ({
          customers: [
            ...state.customers,
            { ...customer, id: `c${Date.now()}`, createdAt: new Date().toISOString() },
          ],
        })),
      updateCustomer: (id, updates) =>
        set((state) => ({
          customers: state.customers.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        })),
      deleteCustomer: (id) =>
        set((state) => ({
          customers: state.customers.filter((c) => c.id !== id),
        })),

      // Requirement actions
      addRequirement: (requirement) =>
        set((state) => ({
          requirements: [
            ...state.requirements,
            { ...requirement, id: `r${Date.now()}`, createdAt: new Date().toISOString() },
          ],
        })),
      updateRequirement: (id, updates) =>
        set((state) => ({
          requirements: state.requirements.map((r) => (r.id === id ? { ...r, ...updates } : r)),
        })),
      deleteRequirement: (id) =>
        set((state) => ({
          requirements: state.requirements.filter((r) => r.id !== id),
        })),

      // Task actions
      addTask: (task) =>
        set((state) => ({
          tasks: [
            ...state.tasks,
            { ...task, id: `t${Date.now()}`, status: task.status || '待处理' },
          ],
        })),
      updateTask: (id, updates) =>
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        })),
      deleteTask: (id) =>
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
        })),
    }),
    {
      name: 'crm-task-sync',
    }
  )
)

export default useStore
