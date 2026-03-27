# CRM-Task Sync

> 极简、AI 驱动的个人工作台 —— 帮助产品经理高效将客户需求转化为可执行工作计划

🔗 **在线访问：** `https://[你的GitHub用户名].github.io/crm-task-sync/`

---

## 功能特性

| 模块 | 功能 |
|------|------|
| 📊 工作台 | 全局概览，今日待办与关键指标 |
| 👥 客户管理 | 客户档案、需求历史、执行进度 |
| 📥 需求收件箱 | 快速记录 + AI 智能标签 + 一键生成任务 |
| 📅 工作计划 | 日/周视图，任务与需求双向关联 |

## 技术栈

- **框架：** React 18 + Vite
- **样式：** Tailwind CSS v4
- **状态：** Zustand（LocalStorage 持久化）
- **路由：** React Router v6
- **图标：** Lucide React
- **部署：** GitHub Pages

## 本地运行

```bash
npm install
npm run dev
```

访问 `http://localhost:5173/crm-task-sync/`

## 部署到 GitHub Pages

方法一（推荐）：推送代码到 `main` 分支，GitHub Actions 自动构建并部署。

方法二（手动）：
```bash
npm run deploy
```

## 数据说明

所有数据存储在浏览器 **LocalStorage** 中，无需后端，完全私有。

---

*由 Claude Code 生成 · v1.0*
