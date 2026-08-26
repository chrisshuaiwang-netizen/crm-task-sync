import { useState } from 'react'
import { Bot, ShieldCheck, SlidersHorizontal, Check, Cpu, Network, AlertTriangle, BookOpen } from 'lucide-react'
import useStore from '../store/useStore'
import { AGENT_SUBROLES } from '../constants'

function Toggle({ on, onChange, disabled }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!on)}
      className={`relative w-11 h-6 rounded-full transition-colors ${on ? 'bg-blue-600' : 'bg-slate-300'} ${disabled ? 'opacity-50' : ''}`}
    >
      <span className={`absolute top-0.5 ${on ? 'left-5' : 'left-0.5'} w-5 h-5 bg-white rounded-full transition-all`} />
    </button>
  )
}

function Field({ label, hint, children }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-slate-50 last:border-0">
      <div className="min-w-0">
        <div className="text-sm font-medium text-slate-700">{label}</div>
        {hint && <div className="text-xs text-slate-400 mt-0.5">{hint}</div>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  )
}

export default function AgentControl() {
  const agentConfig = useStore((s) => s.agentConfig)
  const updateAgentConfig = useStore((s) => s.updateAgentConfig)
  const llmConfig = useStore((s) => s.llmConfig)

  const hasKey = llmConfig?.apiKey && llmConfig.apiKey.trim()

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Bot size={22} className="text-blue-600" />
          Agent 管控
        </h1>
        <p className="text-slate-500 text-sm mt-1">配置智能体的执行边界、子角色与运行策略（确认执行型）</p>
      </div>

      {!hasKey && (
        <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-5">
          <AlertTriangle size={13} />
          未配置模型 Key，Agent 将使用本地启发式解析（按标点拆分 / 关键词匹配）。前往「设置」填入 Key 以启用真 LLM 语义理解。
        </div>
      )}

      {/* 运行策略 */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-5">
        <div className="flex items-center gap-2 mb-2">
          <SlidersHorizontal size={16} className="text-blue-600" />
          <h2 className="font-semibold text-slate-800">运行策略</h2>
        </div>
        <div className="divide-y divide-slate-50">
          <Field label="确认执行" hint="写操作（创建/修改）先返回预览，你确认后才写入；读操作直接执行">
            <Toggle on={!!agentConfig.confirmWrite} onChange={(v) => updateAgentConfig({ confirmWrite: v })} />
          </Field>
          <Field label="最大执行步数" hint="单次对话 Agent 最多执行的动作数，防止失控">
            <input
              type="number"
              min={1}
              max={100}
              value={agentConfig.maxSteps}
              onChange={(e) => updateAgentConfig({ maxSteps: Math.max(1, Number(e.target.value) || 1) })}
              className="w-20 px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </Field>
          <Field label="单次超时(分钟)" hint="单步执行超时时间，超时即终止并告警">
            <input
              type="number"
              min={1}
              max={120}
              value={agentConfig.timeoutMin}
              onChange={(e) => updateAgentConfig({ timeoutMin: Math.max(1, Number(e.target.value) || 1) })}
              className="w-20 px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </Field>
          <Field label="失败重试次数" hint="单步执行失败后的自动重试上限">
            <input
              type="number"
              min={0}
              max={5}
              value={agentConfig.failRetries}
              onChange={(e) => updateAgentConfig({ failRetries: Math.max(0, Number(e.target.value) || 0) })}
              className="w-20 px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </Field>
        </div>
      </div>

      {/* 子角色 */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Network size={16} className="text-indigo-600" />
          <h2 className="font-semibold text-slate-800">子角色编排</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {AGENT_SUBROLES.map((r) => (
            <div key={r.key} className="flex items-start gap-3 bg-slate-50 rounded-lg p-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0">
                <Cpu size={16} />
              </div>
              <div className="min-w-0">
                <div className="font-medium text-slate-800 text-sm">{r.name}</div>
                <div className="text-xs text-slate-500 mt-0.5 leading-relaxed">{r.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-start gap-2 text-xs text-slate-400 mt-4 bg-slate-50 rounded-lg p-3">
          <BookOpen size={13} className="mt-0.5 flex-shrink-0" />
          <span>总控 Agent 负责意图识别、任务拆解与调度，并将执行结果汇总返回。当前为前端模拟编排：所有子角色共享同一套「确认执行」管线，写入经由 store 落库到 LocalStorage。</span>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-2 text-xs text-slate-400">
        <ShieldCheck size={13} />
        所有写操作均经过「确认执行」与审计日志留痕，可在「审计日志」中追溯。
      </div>
    </div>
  )
}
