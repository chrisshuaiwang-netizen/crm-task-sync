/**
 * 轻量语义检索（纯前端、无依赖）
 * 用 token-bag TF-IDF + 余弦相似度做相关性召回，支持中英文混合。
 * 用于知识库 RAG：把「最相关」的若干条目注入 prompt，替代全量硬塞。
 */

/** 分词：英文/数字按词，中文按字 + 二元 (bigram) */
export function tokenize(text = '') {
  const t = String(text).toLowerCase()
  const tokens = []
  const en = t.match(/[a-z0-9]+/g) || []
  tokens.push(...en)
  const cn = t.match(/[一-鿿]/g) || []
  tokens.push(...cn)
  for (let i = 0; i < cn.length - 1; i++) tokens.push(cn[i] + cn[i + 1])
  return tokens
}

function termFreq(tokens) {
  const tf = new Map()
  for (const tk of tokens) tf.set(tk, (tf.get(tk) || 0) + 1)
  // 归一化
  const total = tokens.length || 1
  for (const [k, v] of tf) tf.set(k, v / total)
  return tf
}

function cosine(a, b) {
  let dot = 0
  // 遍历较短的，减少计算
  const [small, big] = a.size <= b.size ? [a, b] : [b, a]
  for (const [k, v] of small) {
    const bv = big.get(k)
    if (bv) dot += v * bv
  }
  return dot
}

/**
 * 从语料中检索与 query 最相关的 Top-K 条目
 * @param {string} query 查询文本
 * @param {Array} corpus 条目数组，每项至少有 id/title/content（或自定义 text 字段）
 * @param {number} [k=5]
 * @param {object} [opt] { textOf: (item)=>string }
 * @returns {Array} 带 score 的条目（已按相关度降序，score ∈ (0,1]）
 */
export function retrieveTopK(query, corpus = [], k = 5, opt = {}) {
  if (!corpus.length) return []
  const textOf = opt.textOf || ((it) => `${it.title || ''}\n${it.content || ''}`)

  // 1) 计算 IDF
  const N = corpus.length
  const df = new Map()
  const docVecs = corpus.map((it) => {
    const tf = termFreq(tokenize(textOf(it)))
    for (const term of tf.keys()) df.set(term, (df.get(term) || 0) + 1)
    return tf
  })
  const idf = new Map()
  for (const [term, d] of df) idf.set(term, Math.log((N + 1) / (d + 1)) + 1)

  // 2) 文档向量 = tf * idf（并归一化长度）
  const normVecs = docVecs.map((tf) => {
    const vec = new Map()
    let len = 0
    for (const [term, v] of tf) {
      const val = v * (idf.get(term) || 1)
      vec.set(term, val)
      len += val * val
    }
    len = Math.sqrt(len) || 1
    for (const [term, v] of vec) vec.set(term, v / len)
    return vec
  })

  // 3) 查询向量
  const qVec = termFreq(tokenize(query))
  const qFull = new Map()
  let qLen = 0
  for (const [term, v] of qVec) {
    const val = v * (idf.get(term) || 1)
    qFull.set(term, val)
    qLen += val * val
  }
  qLen = Math.sqrt(qLen) || 1
  for (const [term, v] of qFull) qFull.set(term, v / qLen)

  // 4) 余弦相似度排序
  const scored = corpus.map((it, i) => ({
    item: it,
    score: cosine(qFull, normVecs[i]),
  }))
  scored.sort((a, b) => b.score - a.score)
  return scored
    .filter((s) => s.score > 0)
    .slice(0, k)
    .map((s) => ({ ...s.item, score: Math.round(s.score * 1000) / 1000 }))
}
