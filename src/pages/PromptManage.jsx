import { useState, useEffect, useMemo } from 'react'
import { Save, RotateCcw, FileCode2, Info, Check } from 'lucide-react'
import useStore, { BUILTIN_PROMPTS } from '../store/useStore'

export default function PromptManage() {
  const promptTemplates = useStore((s) => s.promptTemplates)
  const savePrompt = useStore((s) => s.savePrompt)
  const resetPrompt = useStore((s) => s.resetPrompt)

  const [selectedKey, setSelectedKey] = useState(promptTemplates[0]?.key || '')
  const [draft, setDraft] = useState('')
  const [feedback, setFeedback] = useState('')

  const selected = useMemo(
    () => promptTemplates.find((p) => p.key === selectedKey),
    [promptTemplates, selectedKey]
  )

  // 仅在切换选中项时同步草稿；保存后不重置，便于继续编辑
  useEffect(() => {
    const t = promptTemplates.find((p) => p.key === selectedKey)
    setDraft(t?.content || '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedKey])

  const modified = selected ? draft !== selected.content : false
  const isBuiltin = selected ? draft === (BUILTIN_PROMPTS[selected.key] || '') : false

  const groups = useMemo(() => {
    const map = {}
    promptTemplates.forEach((p) => {
      map[p.group] = map[p.group] || []
      map[p.group].push(p)
    })
    return map
  }, [promptTemplates])

  const handleSave = () => {
    if (!selected || !modified) return
    savePrompt(selected.key, draft)
  }
  const handleReset = () => {
    if (!selected) return
    resetPrompt(selected.key)
    setDraft(BUILTIN_PROMPTS[selected.key] || '')
  }

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <FileCode2 className="text-blue-600" /> 提示词管理
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Agent 各能力背后的系统提示词集中在此维护。修改后实时生效（无需重新打包）；未配置 API Key 时相关功能自动走本地降级逻辑。
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-5">
        {/* 左侧：按场景分组的提示词列表 */}
        <div className="space-y-4">
          {Object.entries(groups).map(([group, items]) => (
            <div key={group}>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 mb-1.5">
                {group}
              </div>
              <div className="space-y-1">
                {items.map((p) => {
                  const active = p.key === selectedKey
                  const changed = p.content !== (BUILTIN_PROMPTS[p.key] || '')
                  return (
                    <button
                      key={p.key}
                      onClick={() => setSelectedKey(p.key)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between gap-2 ${
                        active ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span className="truncate">{p.name}</span>
                      {changed && (
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded ${
                            active ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          已改
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* 右侧：编辑器 */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          {!selected ? (
            <div className="text-slate-400 text-sm">请选择左侧提示词</div>
          ) : (
            <>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">{selected.name}</h2>
                  <p className="text-slate-500 text-xs mt-1 max-w-xl">{selected.scene}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleReset}
                    disabled={isBuiltin}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <RotateCcw size={15} /> 恢复默认
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={!modified}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Save size={15} /> 保存
                  </button>
                </div>
              </div>

              {/* 变量 / 上下文说明 */}
              {selected.variables?.length > 0 && (
                <div className="mb-3 rounded-lg bg-slate-50 border border-slate-200 p-3">
                  <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium mb-1.5">
                    <Info size={14} /> 运行时注入的变量 / 上下文
                  </div>
                  <ul className="space-y-1">
                    {selected.variables.map((v) => (
                      <li key={v.name} className="text-xs text-slate-600 flex gap-2">
                        <code className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-mono shrink-0">
                          {v.name}
                        </code>
                        <span className="text-slate-500">{v.desc}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                spellCheck={false}
                className="w-full h-[420px] font-mono text-[13px] leading-relaxed rounded-xl border border-slate-200 p-4 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-y"
                placeholder="在此编辑系统提示词…"
              />

              {/* 运行反馈 / 微调闭环 */}
              <div className="mt-3 border-t border-slate-100 pt-3">
                <div className="text-xs font-medium text-slate-500 mb-1.5">运行反馈 / 微调（闭环）</div>
                <p className="text-[11px] text-slate-400 mb-2">
                  记录一次 badcase 或效果问题，可一键追加到提示词末尾，形成「运行 → 反馈 → 调优」回路。也可在提示词中手动引用占位符 <code className="px-1 rounded bg-slate-100">{'{feedback}'}</code>。
                </p>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={2}
                  placeholder="例如：分析任务时把『优化转化率』误判为功能类，应识别为提示词类…"
                  className="w-full font-mono text-[12px] rounded-lg border border-slate-200 p-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-y"
                />
                <div className="mt-2 flex items-center gap-2">
                  <button
                    disabled={!feedback.trim()}
                    onClick={() => {
                      const next = draft + '\n\n# 运行反馈\n' + feedback.trim()
                      savePrompt(selected.key, next)
                      setDraft(useStore.getState().getPrompt(selected.key))
                      setFeedback('')
                    }}
                    className="text-xs px-3 py-1.5 rounded-lg bg-slate-700 text-white hover:bg-slate-600 disabled:opacity-40"
                  >
                    追加到提示词
                  </button>
                  {draft.includes('# 运行反馈') && (
                    <span className="text-[11px] text-amber-600">已含历史反馈</span>
                  )}
                </div>
              </div>

              <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                <span>{draft.length} 字</span>
                {modified ? (
                  <span className="text-amber-600">● 未保存的修改</span>
                ) : isBuiltin ? (
                  <span className="text-slate-400">与内置默认一致</span>
                ) : (
                  <span className="text-emerald-600 flex items-center gap-1">
                    <Check size={13} /> 已保存（自定义）
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
