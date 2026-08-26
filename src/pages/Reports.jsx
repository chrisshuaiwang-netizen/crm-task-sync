import { useState } from 'react'
import {
  FileText,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Copy,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ClipboardList,
  Building2,
  Flag,
} from 'lucide-react'
import useStore from '../store/useStore'
import { callLLM } from '../utils/llm'
import { getWeekRange, getMonthRange, getYearRange, inRange, formatDateCN } from '../utils/format'
import { getPermissions, filterByVisibility } from '../constants'

const PERIOD_LABELS = { week: '周报', month: '月报', year: '年报' }

function buildLocal(periodTasks, nameOf) {
  const done = periodTasks.filter((t) => t.status === '已完成')
  const inProg = periodTasks.filter((t) => t.status === '进行中')
  const pending = periodTasks.filter((t) => t.status === '待启动')
  const blocked = periodTasks.filter((t) => t.status === '已暂停' || t.status === '已取消')
  const cn = (id) => nameOf(id) || '未关联客户'

  const completed = done.map((t) => `【${cn(t.customerId)}】${t.title}`)
  const inProgress = inProg.map((t) => `【${cn(t.customerId)}】${t.title}（${t.priority}优先级）`)
  const blockers = blocked.map((t) => `【${cn(t.customerId)}】${t.title}（${t.status}）`)

  const byC = {}
  periodTasks.forEach((t) => {
    const name = cn(t.customerId)
    byC[name] = byC[name] || { total: 0, done: 0 }
    byC[name].total++
    if (t.status === '已完成') byC[name].done++
  })
  const customerSituation = Object.entries(byC).map(
    ([n, v]) => `${n}：本周期 ${v.total} 项任务，已完成 ${v.done} 项`
  )

  const nextPlan = pending.map(
    (t) => `推进【${cn(t.customerId)}】${t.title}${t.deadline ? `（截止 ${t.deadline}）` : ''}`
  )

  const total = periodTasks.length
  const summary =
    total === 0
      ? '本周期暂无排期任务。'
      : `本周期共 ${total} 项任务，已完成 ${done.length} 项，进行中 ${inProg.length} 项。`

  return { summary, completed, inProgress, blockers, customerSituation, nextPlan }
}

function normalizeReport(parsed) {
  const arr = (x) => (Array.isArray(x) ? x.filter((s) => typeof s === 'string' && s.trim()) : [])
  return {
    summary: (parsed.summary || '').toString(),
    completed: arr(parsed.completed),
    inProgress: arr(parsed.inProgress),
    blockers: arr(parsed.blockers),
    customerSituation: arr(parsed.customerSituation),
    nextPlan: arr(parsed.nextPlan),
  }
}

export default function Reports() {
  const allTasks = useStore((s) => s.tasks)
  const allCustomers = useStore((s) => s.customers)
  const llmConfig = useStore((s) => s.llmConfig)
  const workspace = useStore((s) => s.workspaces[s.activeWorkspaceId])

  const perms = getPermissions(workspace)
  const tasks = filterByVisibility(allTasks, workspace, (t) => t.ownerId)
  const nameOf = (id) => allCustomers.find((c) => c.id === id)?.name || ''
  const [periodType, setPeriodType] = useState('week')
  const [refDate, setRefDate] = useState(new Date())
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const hasKey = llmConfig?.apiKey && llmConfig.apiKey.trim()

  function getRange() {
    if (periodType === 'week') return getWeekRange(refDate)
    if (periodType === 'month') return getMonthRange(refDate)
    return getYearRange(refDate)
  }

  function getPeriodTasks(range) {
    return tasks.filter((t) => {
      const d = t.scheduledDate || (t.createdAt ? t.createdAt.slice(0, 10) : '')
      return inRange(d, range.start, range.end)
    })
  }

  function shiftPeriod(dir) {
    const d = new Date(refDate)
    if (periodType === 'week') d.setDate(d.getDate() + dir * 7)
    else if (periodType === 'month') d.setMonth(d.getMonth() + dir)
    else d.setFullYear(d.getFullYear() + dir)
    setRefDate(d)
    setReport(null)
  }

  async function handleGenerate() {
    setLoading(true)
    setCopied(false)
    const range = getRange()
    const periodTasks = getPeriodTasks(range)

    if (!hasKey) {
      setReport({ ...buildLocal(periodTasks, nameOf), range, usedFallback: true })
      setLoading(false)
      return
    }

    try {
      const dataText = periodTasks
        .map(
          (t) =>
            `- 【${nameOf(t.customerId) || '未关联客户'}】${t.title} | 状态:${t.status} | 优先级:${t.priority} | 标签:${(t.tags || []).join('/')} | 截止:${t.deadline || '无'}`
        )
        .join('\n')
      const userContent = `时间段：${range.start} 至 ${range.end}\n本周期任务清单：\n${dataText || '（无）'}\n\n请生成${PERIOD_LABELS[periodType]}。`

      const raw = await callLLM({
        providerId: llmConfig.provider,
        apiKey: llmConfig.apiKey,
        model: llmConfig.model,
        messages: [
          { role: 'system', content: useStore.getState().getPrompt('report_generate') },
          { role: 'user', content: userContent },
        ],
        opts: { temperature: 0.4, json: true },
      })
      const parsed = JSON.parse(raw)
      setReport({ ...normalizeReport(parsed), range, usedFallback: false })
    } catch (e) {
      setReport({ ...buildLocal(periodTasks, nameOf), range, usedFallback: true, error: e.message })
    }
    setLoading(false)
  }

  function toPlainText() {
    if (!report) return ''
    const lines = []
    lines.push(`${PERIOD_LABELS[periodType]}（${formatDateCN(report.range.start)} - ${formatDateCN(report.range.end)}）`)
    lines.push('')
    lines.push('【总览】' + report.summary)
    const sec = (title, items) => {
      if (!items || items.length === 0) return
      lines.push('')
      lines.push(`【${title}】`)
      items.forEach((x) => lines.push('· ' + x))
    }
    sec('已完成', report.completed)
    sec('进行中', report.inProgress)
    sec('风险/阻塞', report.blockers)
    sec('客户情况', report.customerSituation)
    sec('下期计划', report.nextPlan)
    return lines.join('\n')
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(toPlainText())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* 忽略 */
    }
  }

  const range = getRange()

  const sections = [
    { key: 'completed', title: '已完成', icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', dotColor: 'bg-green-500', items: report?.completed },
    { key: 'inProgress', title: '进行中', icon: ClipboardList, color: 'text-blue-600', bg: 'bg-blue-50', dotColor: 'bg-blue-500', items: report?.inProgress },
    { key: 'blockers', title: '风险 / 阻塞', icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', dotColor: 'bg-red-500', items: report?.blockers },
    { key: 'customerSituation', title: '客户情况', icon: Building2, color: 'text-orange-600', bg: 'bg-orange-50', dotColor: 'bg-orange-500', items: report?.customerSituation },
    { key: 'nextPlan', title: '下期计划', icon: Flag, color: 'text-indigo-600', bg: 'bg-indigo-50', dotColor: 'bg-indigo-500', items: report?.nextPlan },
  ]

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">工作报告</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            自动汇总工作进度，支持周报 / 月报 / 年报
            {perms.viewScope === 'mine' && ' · 仅统计你负责的任务'}
          </p>
        </div>
      </div>

      {/* 控制器 */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
            {['week', 'month', 'year'].map((p) => (
              <button
                key={p}
                onClick={() => { setPeriodType(p); setReport(null) }}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  periodType === p ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => shiftPeriod(-1)}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm text-slate-600 min-w-[140px] text-center">
              {formatDateCN(range.start)} - {formatDateCN(range.end)}
            </span>
            <button
              onClick={() => shiftPeriod(1)}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {loading ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                生成中…
              </>
            ) : (
              <>
                <Sparkles size={15} />
                生成{PERIOD_LABELS[periodType]}
              </>
            )}
          </button>
        </div>
        {!hasKey && (
          <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5 mt-3">
            <AlertTriangle size={13} />
            未配置模型，将用本地模板汇总；在「设置」填 Key 可获 AI 撰写报告。
          </div>
        )}
      </div>

      {/* 报告内容 */}
      {!report ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
          <FileText size={40} className="mb-3 text-slate-200" />
          <p className="text-base">选择周期后点击「生成{PERIOD_LABELS[periodType]}」</p>
          <p className="text-sm mt-1">报告会基于该时间段内的排期任务自动汇总</p>
        </div>
      ) : (
        <div className="space-y-4">
          {report.usedFallback && (
            <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
              <AlertTriangle size={13} />
              {hasKey ? `AI 生成失败，已用本地模板：${report.error || ''}` : '当前为本地模板汇总，配置模型后可获 AI 撰写。'}
            </div>
          )}

          {/* 总览 */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl p-5 text-white">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={16} />
              <span className="text-sm font-medium">{PERIOD_LABELS[periodType]}总览</span>
              <span className="text-blue-100 text-xs ml-auto">{formatDateCN(report.range.start)} - {formatDateCN(report.range.end)}</span>
            </div>
            <p className="text-lg font-semibold leading-snug">{report.summary}</p>
          </div>

          {/* 各 section */}
          {sections.map((s) => (
            <div key={s.key} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-100">
                <div className={`w-7 h-7 rounded-lg ${s.bg} flex items-center justify-center`}>
                  <s.icon size={15} className={s.color} />
                </div>
                <h3 className="font-semibold text-slate-800 text-sm">{s.title}</h3>
                <span className="text-xs text-slate-400">{(s.items || []).length}</span>
              </div>
              {(s.items || []).length === 0 ? (
                <div className="px-5 py-4 text-sm text-slate-400">无</div>
              ) : (
                <ul className="px-5 py-3 space-y-2">
                  {s.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                      <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.dotColor}`} />
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}

          <button
            onClick={handleCopy}
            className="flex items-center gap-2 mx-auto px-4 py-2 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            {copied ? <CheckCircle2 size={15} className="text-green-500" /> : <Copy size={15} />}
            {copied ? '已复制' : '复制报告'}
          </button>
        </div>
      )}
    </div>
  )
}
