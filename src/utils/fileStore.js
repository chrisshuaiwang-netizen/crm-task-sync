/**
 * 文件存储 — 基于 IndexedDB 存 Blob
 * LocalStorage 有 ~5MB 限制，文件（尤其是图片/原型）走 IndexedDB 更稳。
 * store.files 只存元数据（id/name/size/type），blob 本体存这里，按 id 关联。
 */
const DB_NAME = 'agent-biz-files'
const STORE = 'blobs'
const VERSION = 1

let dbPromise = null
function openDB() {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('当前环境不支持 IndexedDB'))
      return
    }
    const req = indexedDB.open(DB_NAME, VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  return dbPromise
}

function tx(mode) {
  return openDB().then((db) => db.transaction(STORE, mode).objectStore(STORE))
}

/** 存入文件，返回 id */
export async function putFile(file) {
  const id = `f${Date.now()}${Math.random().toString(36).slice(2, 7)}`
  const store = await tx('readwrite')
  await new Promise((resolve, reject) => {
    const r = store.put(file, id)
    r.onsuccess = () => resolve()
    r.onerror = () => reject(r.error)
  })
  return id
}

/** 取回 Blob */
export async function getFile(id) {
  const store = await tx('readonly')
  return new Promise((resolve, reject) => {
    const r = store.get(id)
    r.onsuccess = () => resolve(r.result || null)
    r.onerror = () => reject(r.error)
  })
}

/** 删除 */
export async function deleteFile(id) {
  const store = await tx('readwrite')
  return new Promise((resolve, reject) => {
    const r = store.delete(id)
    r.onsuccess = () => resolve()
    r.onerror = () => reject(r.error)
  })
}

/** 取回文本（文本类文件用于分析/预览） */
export async function getText(id) {
  const blob = await getFile(id)
  if (!blob) return ''
  try {
    return await blob.text()
  } catch {
    return ''
  }
}

/** 生成下载用的 object URL（调用方用完应 revokeObjectURL） */
export async function getObjectURL(id) {
  const blob = await getFile(id)
  if (!blob) return null
  return URL.createObjectURL(blob)
}

/** 触发浏览器下载 */
export async function downloadFile(meta) {
  const url = await getObjectURL(meta.id)
  if (!url) return
  const a = document.createElement('a')
  a.href = url
  a.download = meta.name || 'download'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
