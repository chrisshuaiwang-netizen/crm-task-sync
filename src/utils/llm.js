/**
 * LLM 客户端 — OpenAI 兼容接口，前端直连
 * 支持 DeepSeek / 通义千问 / 豆包（均在 constants.LLM_PROVIDERS 配置）
 *
 * 能力：
 * - callLLM          非流式调用（保持返回 string，兼容旧调用方）
 * - callLLMStream     流式调用（SSE，逐 token 回调 onToken）
 * - estimateTokens    本地 token 估算（中英混合启发式）
 * - estimateCost      按模型定价估算成本（仅供参考）
 * - 统一：超时 / AbortController 取消 / 指数退避重试
 */
import { getProvider } from '../constants'

/**
 * 模型定价表（估算，单位：元 / 1M tokens，in=输入 out=输出）
 * 仅供前端成本核算展示，非账单依据。
 */
const PRICING = {
  'deepseek-chat': { in: 1, out: 2 },
  'deepseek-reasoner': { in: 4, out: 16 },
  'qwen-plus': { in: 0.8, out: 2 },
  'qwen-max': { in: 2.4, out: 9.6 },
  'qwen-turbo': { in: 0.3, out: 0.6 },
  'doubao-pro': { in: 0.8, out: 2 },
  'doubao-lite': { in: 0.3, out: 0.6 },
}
function pricingFor(model = '') {
  const hit = Object.keys(PRICING).find((k) => model.includes(k))
  return PRICING[hit] || { in: 2, out: 6 } // 通用兜底估算
}

/** 本地 token 估算：中文约 1.6 字符/token，英文约 4 字符/token */
export function estimateTokens(text = '') {
  const cn = (text.match(/[一-鿿]/g) || []).length
  const en = text.length - cn
  return Math.max(1, Math.ceil(cn / 1.6 + en / 4))
}

/** 成本估算（元），基于输入/输出 token 数 */
export function estimateCost(model, promptTokens, completionTokens) {
  const p = pricingFor(model)
  const cost = (promptTokens / 1e6) * p.in + (completionTokens / 1e6) * p.out
  return Math.round(cost * 10000) / 10000
}

/**
 * 带超时 / 外部取消 / 指数退避重试的 fetch
 * - 超时：内部 AbortController，超时抛出「请求超时」
 * - 取消：若调用方传入 init.signal（外部 AbortSignal），其 abort 时一并中断本次请求
 * - 重试：网络类错误指数退避；超时 / 取消不重试
 */
async function fetchWithRetry(url, init, { timeout = 30000, retries = 1 } = {}) {
  const external = init.signal
  let lastErr
  for (let attempt = 0; attempt <= retries; attempt++) {
    const ctrl = new AbortController()
    const tid = setTimeout(() => ctrl.abort(new Error('__TIMEOUT__')), timeout)
    let onExtAbort
    if (external) {
      if (external.aborted) {
        clearTimeout(tid)
        throw new Error('请求已取消')
      }
      onExtAbort = () => ctrl.abort(new Error('__CANCEL__'))
      external.addEventListener('abort', onExtAbort, { once: true })
    }
    try {
      const res = await fetch(url, { ...init, signal: ctrl.signal })
      clearTimeout(tid)
      if (!res.ok) {
        let detail = ''
        try {
          const err = await res.json()
          detail = err?.error?.message || JSON.stringify(err)
        } catch {
          detail = await res.text().catch(() => '')
        }
        throw new Error(`模型返回错误 ${res.status}：${detail}`)
      }
      return res
    } catch (e) {
      clearTimeout(tid)
      if (onExtAbort) external.removeEventListener('abort', onExtAbort)
      const reason = ctrl.signal.reason
      if (reason === '__TIMEOUT__') throw new Error('请求超时')
      if (reason === '__CANCEL__') throw new Error('请求已取消')
      lastErr = e
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 500 * (attempt + 1))) // 指数退避
        continue
      }
      throw new Error(`网络请求失败（可能是浏览器跨域限制或密钥无效）：${e.message}`)
    }
  }
  throw lastErr
}

/**
 * 非流式调用大模型
 * @param {object} opts
 * @param {string} opts.providerId
 * @param {string} opts.apiKey
 * @param {string} opts.model
 * @param {Array}  opts.messages   [{role, content}]
 * @param {object} [opts.opts]     { temperature, json }
 * @param {object} [opts.extra]    { signal, timeout, retries }
 * @returns {Promise<string>} 助手回复文本
 */
export async function callLLM({ providerId, apiKey, model, messages, opts = {}, extra = {} }) {
  const provider = getProvider(providerId)
  if (!apiKey || !apiKey.trim()) {
    throw new Error('未配置 API Key，请先到「设置」页填写')
  }

  const body = {
    model: model || provider.defaultModel,
    messages,
    temperature: opts.temperature ?? 0.3,
  }
  if (opts.json) {
    body.response_format = { type: 'json_object' }
  }

  const res = await fetchWithRetry(`${provider.baseURL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey.trim()}`,
    },
    body: JSON.stringify(body),
    signal: extra.signal,
  }, { timeout: extra.timeout ?? 30000, retries: extra.retries ?? 1 })

  const data = await res.json()
  const text = data?.choices?.[0]?.message?.content ?? ''
  if (!text) throw new Error('模型返回为空')
  return text
}

/**
 * 流式调用大模型（SSE），逐 token 回调 onToken
 * 用于纯文本对话场景（助手闲聊、读操作回答）；需要解析 JSON 的场景请仍用 callLLM。
 * @param {object} opts 同 callLLM，额外 { onToken: (chunk:string)=>void }
 */
export async function callLLMStream({ providerId, apiKey, model, messages, opts = {}, extra = {}, onToken }) {
  const provider = getProvider(providerId)
  if (!apiKey || !apiKey.trim()) {
    throw new Error('未配置 API Key，请先到「设置」页填写')
  }

  const body = {
    model: model || provider.defaultModel,
    messages,
    temperature: opts.temperature ?? 0.5,
    stream: true,
  }

  const res = await fetchWithRetry(`${provider.baseURL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey.trim()}`,
    },
    body: JSON.stringify(body),
    signal: extra.signal,
  }, { timeout: extra.timeout ?? 60000, retries: extra.retries ?? 1 })

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buf = ''
  let full = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buf += decoder.decode(value, { stream: true })
    const lines = buf.split('\n')
    buf = lines.pop() || ''
    for (const line of lines) {
      const t = line.trim()
      if (!t || !t.startsWith('data:')) continue
      const data = t.slice(5).trim()
      if (data === '[DONE]') return full
      try {
        const j = JSON.parse(data)
        const tok = j.choices?.[0]?.delta?.content || ''
        if (tok) {
          full += tok
          if (onToken) onToken(tok)
        }
      } catch {
        /* 忽略不完整分片 */
      }
    }
  }
  return full
}

/** 测试连通性（简单问答） */
export async function testConnection({ providerId, apiKey, model, extra = {} }) {
  const text = await callLLM({
    providerId,
    apiKey,
    model,
    messages: [{ role: 'user', content: '回复两个字：正常' }],
    opts: { temperature: 0 },
    extra,
  })
  return text
}
