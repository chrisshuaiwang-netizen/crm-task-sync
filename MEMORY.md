# CRM-Task Sync · 产品经理工作台

> 项目路径：`~/Desktop/产品 AI 提效探索/crm-task-sync/`
> PRD 版本：v2.0 | 文档日期：2026-03-30 | 状态：已上线（GitHub Pages）

---

## 技术栈

| 层 | 技术 |
|---|---|
| 框架 | React 19 + Vite 8 |
| 样式 | Tailwind CSS v4（@tailwindcss/vite 插件） |
| 状态管理 | Zustand 5 + persist 中间件（LocalStorage 键：`crm-task-sync`） |
| 路由 | React Router v6（HashRouter，支持 GitHub Pages） |
| 富文本编辑器 | Tiptap v3（@tiptap/react + @tiptap/starter-kit） |
| 图标 | Lucide React |
| AI 模块 | 本地规则引擎（`src/utils/aiEngine.js`） |
| 部署 | GitHub Pages（gh-pages npm 包），`npm run deploy` |

---

## 目录结构

```
src/
├── components/Sidebar.jsx       # 左侧导航（宽 w-60，bg-slate-900）
├── pages/
│   ├── Dashboard.jsx            # 总览工作台 /
│   ├── Customers.jsx            # 客户管理 /customers（导出 PRODUCT_CATEGORIES/PRODUCT_CATEGORY_COLORS）
│   ├── Inbox.jsx                # 需求管理 /inbox
│   ├── Schedule.jsx             # 工作计划 /schedule
│   └── DailyNotes.jsx           # 日常事项 /daily-notes
├── store/useStore.js            # Zustand 全局状态 + LocalStorage 持久化
├── utils/aiEngine.js            # AI 规则引擎
├── App.jsx                      # 路由挂载（HashRouter）
└── index.css                    # 全局样式（含 Tiptap 富文本样式 .rich-text-editor）
```

---

## 数据模型

### Customer（客户）
```js
{
  id: 'c{timestamp}',
  name: string,           // 必填
  industry: string,       // 金融科技/大数据/零售电商/物流科技/医疗健康/教育科技/企业服务/其他
  priority: '高'|'中'|'低',
  contact: string,
  phone: string,
  notes: string,
  productCategory: string, // 必填，见产品分类枚举
  createdAt: string,       // ISO 8601
}
```

### Requirement（需求）
```js
{
  id: 'r{timestamp}',
  title: string,           // 必填
  content: string,         // 必填，AI 分析的输入
  customerId: string,
  productCategory: string, // 必填
  tags: string[],          // 最多3个：功能优化/Bug修复/新需求/数据需求/体验优化
  priority: '高'|'中'|'低',
  status: RequirementStatus,
  source: string,          // 微信/会议/电话/邮件
  createdAt: string,
  deadline: string,        // YYYY-MM-DD
  aiSummary: string,
  planNote: string,        // 方案进度备注（工作计划-产品方案Tab编辑）
  devNote: string,         // 开发进度备注（工作计划-开发计划Tab编辑）
  fileUrl: string,
  fileName: string,
}
```

**需求状态枚举（RequirementStatus）**：
`未开始` | `方案中` | `待评审` | `开发中` | `已上线` | `已暂停` | `已拒绝`

**新建需求**：初始状态固定为 `待评审`（见 Inbox.jsx handleSaveRequirement）

### DailyNote（日常事项）
```js
{
  id: 'n{timestamp}',
  title: string,           // 必填
  content: string,         // 富文本 HTML
  date: string,            // YYYY-MM-DD
  category: '会议'|'沟通'|'其他',
  aiSummary: string,
  createdAt: string,
}
```

---

## 产品分类枚举（PRODUCT_CATEGORIES）
定义在 `Customers.jsx`，被 `Inbox.jsx` 和 `Schedule.jsx` 引用：
```js
['DAM', '开放平台-国内标准版', '开放平台-海外标准版', '私有化部署', 'B TO C合作']
```
对应颜色（PRODUCT_CATEGORY_COLORS）：
- DAM → `bg-blue-100 text-blue-700`
- 开放平台-国内标准版 → `bg-purple-100 text-purple-700`
- 开放平台-海外标准版 → `bg-indigo-100 text-indigo-700`
- 私有化部署 → `bg-orange-100 text-orange-700`
- B TO C合作 → `bg-teal-100 text-teal-700`

---

## 页面路由与功能概要

### Dashboard（总览）
- 4 个统计卡片：待处理需求数、总需求数、客户总数、已上线需求数
- 待处理需求列表：`status==='未开始'`，最多5条，点击跳转 `/inbox`
- 进行中需求列表：`status ∈ {方案中,待评审,开发中}`，最多5条，按状态顺序+截止日期排序，点击跳转 `/schedule`

### Customers（客户管理）
- 按产品分类分组，组内按优先级排序（高→中→低）
- 筛选：关键词搜索 + 产品分类下拉 + 优先级 Tab
- 右侧详情面板：客户信息 + 两个 Tab（需求列表/工作计划）
  - 工作计划 Tab：仅展示 `status ∈ {方案中, 开发中}` 的需求
- 新增/编辑：模态弹窗；删除：二次确认弹窗

### Inbox（需求管理）
- 顶部状态筛选 Tab（7种状态+全部）+ 下拉组合筛选（产品分类/优先级/客户）
- 排序：按状态优先级排序，同状态内按创建时间降序
- 右侧详情面板（384px）：元数据 + 需求内容 + AI摘要 + 附件 + 7个状态变更按钮
- AI 分析：点击「AI 智能分析」按钮，1.5秒后自动填充 tags/priority/aiSummary
- 新建需求必填：标题、需求内容、产品分类
- Toast 提示（3秒消失）：需求已记录 / 已更新 / 已删除

### Schedule（工作计划）
- 3个 Tab，数据自动从需求状态派生（无独立数据，不可手动录入）：
  - 待处理需求 → `status==='未开始'`，进度字段：`planNote`（备注）
  - 产品方案 → `status==='方案中'`，进度字段：`planNote`（方案进度）
  - 开发计划 → `status==='开发中'`，进度字段：`devNote`（开发进度）
- 需求卡片可展开/收起：展开显示需求内容、AI摘要、进度备注（可内联编辑）
- 进度备注保存：调用 `updateRequirement(id, { planNote/devNote: value })`

### DailyNotes（日常事项）
- 左侧固定面板（w-72）：搜索 + 时间筛选（全部/今天/本周/本月）+ 分类筛选（会议/沟通/其他）
- 右侧编辑面板：Tiptap 富文本编辑器，内容以 HTML 存储
- 切换笔记：`editor.commands.setContent()` 重置编辑器避免受控/非受控冲突
- AI 总结：900ms 后展示，保存时一并持久化
- 新建：`id='_new'` 临时占位，保存后创建真实记录

---

## Store（useStore.js）

状态：`customers[]`、`requirements[]`、`tasks[]`（已有但未在当前页面使用）、`dailyNotes[]`

Actions：
- `addCustomer(customer)` / `updateCustomer(id, updates)` / `deleteCustomer(id)`
- `addRequirement(requirement)` / `updateRequirement(id, updates)` / `deleteRequirement(id)`
- `addDailyNote(note)` / `updateDailyNote(id, updates)` / `deleteDailyNote(id)`
- `addTask(task)` / `updateTask(id, updates)` / `deleteTask(id)`

ID 生成规则：`c${Date.now()}`、`r${Date.now()}`、`n${Date.now()}`、`t${Date.now()}`

---

## AI 引擎（aiEngine.js）

### analyzeRequirement(content)
- 关键词匹配识别标签（最多3个），关键词匹配判断优先级
- 返回：`{ tags: string[], priority: '高'|'中'|'低', summary: string }`
- 摘要 = 内容前60字 + " | " + 主标签对应的处置建议

### summarizeDailyNote({ title, content, category })
- 剥离 HTML → 检测行动项/决策结论/风险阻塞关键词 → 拼接自然语言总结
- 返回：string

### generateTask(requirement)
- 根据标签生成任务标题/描述模板 + 按优先级估算工时
- 返回：`{ title, desc, hours }`（供未来功能使用，当前页面未调用）

### generateDailyPriority(tasks)
- 按优先级×状态评分排序，生成今日任务建议文案
- 当前页面未调用

---

## 样式规范（Tailwind 颜色约定）

### 需求状态颜色
| 状态 | badge 样式 | dot 样式 |
|---|---|---|
| 未开始 | `bg-slate-100 text-slate-500` | `bg-slate-300` |
| 方案中 | `bg-indigo-100 text-indigo-600` | `bg-indigo-400` |
| 待评审 | `bg-yellow-100 text-yellow-700` | `bg-yellow-400` |
| 开发中 | `bg-blue-100 text-blue-700` | `bg-blue-500` |
| 已上线 | `bg-green-100 text-green-700` | `bg-green-500` |
| 已暂停 | `bg-gray-100 text-gray-600` | `bg-gray-400` |
| 已拒绝 | `bg-red-100 text-red-600` | `bg-red-400` |

### 优先级颜色（PRIORITY_BADGE）
- 高：`bg-red-100 text-red-700 border border-red-200`
- 中：`bg-yellow-100 text-yellow-700 border border-yellow-200`
- 低：`bg-green-100 text-green-700 border border-green-200`

### 需求标签颜色（TAG_COLORS）
- 功能优化：`bg-purple-100 text-purple-700`
- Bug修复：`bg-red-100 text-red-700`
- 新需求：`bg-blue-100 text-blue-700`
- 数据需求：`bg-orange-100 text-orange-700`
- 体验优化：`bg-teal-100 text-teal-700`

---

## 版本规划

### v1.0 (已上线) ✅
客户管理 + 需求管理 + 工作计划 + 日常事项 + 总览工作台 + AI 本地规则引擎

### v1.1 (规划中)
- 用户账号体系（JWT 认证）
- 数据云端存储（替换 LocalStorage）
- **AI 接入 Claude API（`claude-sonnet-4-6`）**
- 附件真实上传（对象存储）
- 需求状态变更历史记录

### v1.2 (规划中)
多人协作 / 客户多联系人 / 需求批量导出 / 数据看板 / 移动端适配

---

## 重要说明与注意事项

1. **工作计划页无独立数据**：所有内容从 requirements 状态自动派生，修改状态即同步
2. **客户详情「工作计划」Tab**：仅展示 `方案中` + `开发中` 的需求（非全部进行中状态）
3. **Tiptap 编辑器切换笔记**：必须用 `editor.commands.setContent()` 而非 React state 控制，避免受控/非受控冲突
4. **新建需求状态**：固定为 `待评审`，不允许客户端指定其他状态
5. **产品分类是枚举**：需在 `Customers.jsx` 中维护 `PRODUCT_CATEGORIES` 数组，其他页面从此处 import
6. **Store 中保留 `tasks` 数据**（4条示例数据）：当前版本的 Schedule 页已重构为纯状态派生，tasks 字段暂未在页面中使用，但 store actions 仍存在
7. **AI 功能当前为本地规则引擎**：生产化建议接入 Claude API（claude-sonnet-4-6），参见 PRD 9.5 节 AI 接口设计

---

*记忆文件生成日期：2026-04-14*
