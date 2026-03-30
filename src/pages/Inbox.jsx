import { useState } from 'react'
import {
  Plus,
  X,
  Inbox as InboxIcon,
  Sparkles,
  ChevronRight,
  Clock,
  Tag,
  User,
  Loader2,
  CheckCircle2,
  MessageSquare,
  AlertTriangle,
  Pencil,
  Trash2,
} from 'lucide-react'
import useStore from '../store/useStore'
import { analyzeRequirement, generateTask } from '../utils/aiEngine'
import { PRODUCT_CATEGORIES, PRODUCT_CATEGORY_COLORS } from './Customers'

const PRIORITY_BADGE = {
  高: 'bg-red-100 text-red-700 border border-red-200',
  中: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
  低: 'bg-green-100 text-green-700 border border-green-200',
}

const STATUS_CONFIG = {
  待评审: { badge: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-400' },
  开发中: { badge: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
  已上线: { badge: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
  已拒绝: { badge: 'bg-red-100 text-red-600', dot: 'bg-red-400' },
  已暂停: { badge: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' },
}

const TAG_COLORS = {
  功能优化: 'bg-purple-100 text-purple-700',
  Bug修复: 'bg-red-100 text-red-700',
  新需求: 'bg-blue-100 text-blue-700',
  数据需求: 'bg-orange-100 text-orange-700',
  体验优化: 'bg-teal-100 text-teal-700',
}

const ALL_STATUSES = ['全部', '待评审', '开发中', '已上线', '已拒绝', '已暂停']

const defaultForm = {
  title: '',
  content: '',
  customerId: '',
  source: '',
  priority: '中',
  status: '待评审',
  tags: [],
  deadline: '',
  aiSummary: '',
  fileUrl: '',
  fileName: '',
  productCategory: '',
}

function formatTime(isoStr) {
  if (!isoStr) return ''
  const d = new Date(isoStr)
  const now = new Date()
  const diffD = Math.floor((now - d) / 86400000)
  if (diffD === 0) return '今天'
  if (diffD === 1) return '昨天'
  if (diffD < 7) return `${diffD}天前`
  return d.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })
}

function Toast({ message, type }) {
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all ${
        type === 'success' ? 'bg-green-600 text-white' : 'bg-slate-800 text-white'
      }`}
    >
      {type === 'success' ? <CheckCircle2 size={16} /> : <MessageSquare size={16} />}
      {message}
    </div>
  )
}

export default function Inbox() {
  const { requirements, customers, tasks, addRequirement, updateRequirement, deleteRequirement, addTask } = useStore()

  const [statusFilter, setStatusFilter] = useState('全部')
  const [priorityFilter, setPriorityFilter] = useState('全部')
  const [customerFilter, setCustomerFilter] = useState('全部')
  const [productCategoryFilter, setProductCategoryFilter] = useState('全部')
  const [selectedReq, setSelectedReq] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [editingReq, setEditingReq] = useState(null)
  const [formData, setFormData] = useState(defaultForm)
  const [aiAnalyzing, setAiAnalyzing] = useState(false)
  const [aiResult, setAiResult] = useState(null)
  const [generatingTask, setGeneratingTask] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null)
  const [toast, setToast] = useState(null)

  function showToast(message, type = 'success') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const filtered = requirements.filter((r) => {
    if (statusFilter !== '全部' && r.status !== statusFilter) return false
    if (priorityFilter !== '全部' && r.priority !== priorityFilter) return false
    if (customerFilter !== '全部' && r.customerId !== customerFilter) return false
    if (productCategoryFilter !== '全部' && r.productCategory !== productCategoryFilter) return false
    return true
  }).sort((a, b) => {
    const STATUS_ORDER = { 待评审: 0, 开发中: 1, 已上线: 2, 已暂停: 3, 已拒绝: 4 }
    const sd = (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99)
    if (sd !== 0) return sd
    return new Date(b.createdAt) - new Date(a.createdAt)
  })

  function getCustomerName(customerId) {
    const c = customers.find((c) => c.id === customerId)
    return c ? c.name : '未关联客户'
  }

  function openNewModal() {
    setEditingReq(null)
    setFormData(defaultForm)
    setAiResult(null)
    setShowModal(true)
  }

  function openEditModal(req) {
    setEditingReq(req)
    setFormData({
      title: req.title,
      content: req.content,
      customerId: req.customerId,
      source: req.source || '',
      priority: req.priority,
      status: req.status,
      tags: req.tags || [],
      deadline: req.deadline || '',
      aiSummary: req.aiSummary || '',
      fileUrl: req.fileUrl || '',
      fileName: req.fileName || '',
      productCategory: req.productCategory || '',
    })
    setAiResult(null)
    setShowModal(true)
  }

  function handleAiAnalyze() {
    if (!formData.content.trim()) return
    setAiAnalyzing(true)
    setTimeout(() => {
      const result = analyzeRequirement(formData.content)
      setAiResult(result)
      setFormData((prev) => ({
        ...prev,
        tags: result.tags,
        priority: result.priority,
        aiSummary: result.summary,
      }))
      setAiAnalyzing(false)
    }, 1500)
  }

  function handleSaveRequirement() {
    if (!formData.content.trim() || !formData.title.trim()) return
    const payload = {
      title: formData.title,
      content: formData.content,
      customerId: formData.customerId,
      tags: formData.tags.length > 0 ? formData.tags : ['新需求'],
      priority: formData.priority,
      source: formData.source,
      deadline: formData.deadline,
      aiSummary: formData.aiSummary,
      fileUrl: formData.fileUrl,
      fileName: formData.fileName,
      productCategory: formData.productCategory,
    }
    if (editingReq) {
      updateRequirement(editingReq.id, { ...payload, status: formData.status })
      if (selectedReq?.id === editingReq.id) {
        setSelectedReq({ ...selectedReq, ...payload, status: formData.status, fileUrl: formData.fileUrl, fileName: formData.fileName, productCategory: formData.productCategory })
      }
      showToast('需求已更新')
    } else {
      addRequirement({ ...payload, status: '待评审' })
      showToast('需求已记录')
    }
    setShowModal(false)
  }

  function handleStatusChange(reqId, newStatus) {
    updateRequirement(reqId, { status: newStatus })
    if (selectedReq && selectedReq.id === reqId) {
      setSelectedReq({ ...selectedReq, status: newStatus })
    }
  }

  function handleGenerateTask(req) {
    setGeneratingTask(true)
    setTimeout(() => {
      const taskData = generateTask(req)
      const today = new Date().toISOString().split('T')[0]
      addTask({
        title: taskData.title,
        desc: taskData.desc,
        requirementId: req.id,
        customerId: req.customerId,
        date: today,
        hours: taskData.hours,
        status: '待处理',
        priority: req.priority,
      })
      setGeneratingTask(false)
      showToast('任务已生成并添加到工作计划')
    }, 1200)
  }

  function handleDelete(id) {
    deleteRequirement(id)
    setShowDeleteConfirm(null)
    if (selectedReq?.id === id) setSelectedReq(null)
    showToast('需求已删除')
  }

  function toggleTag(tag) {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter((t) => t !== tag) : [...prev.tags, tag],
    }))
  }

  const statusCounts = ALL_STATUSES.reduce((acc, s) => {
    acc[s] = s === '全部' ? requirements.length : requirements.filter((r) => r.status === s).length
    return acc
  }, {})

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Main list */}
      <div className={`flex flex-col flex-1 min-w-0 ${selectedReq ? 'border-r border-slate-200' : ''}`}>
        <div className="flex-1 overflow-y-auto p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">需求管理</h1>
              <p className="text-slate-500 text-sm mt-0.5">共 {requirements.length} 条需求</p>
            </div>
            <button
              onClick={openNewModal}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <Plus size={16} />
              记录需求
            </button>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1 mb-5 bg-white border border-slate-200 rounded-lg p-1 w-fit">
            {ALL_STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  statusFilter === s
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {s}
                <span
                  className={`text-xs min-w-[18px] text-center ${
                    statusFilter === s ? 'text-blue-200' : 'text-slate-400'
                  }`}
                >
                  {statusCounts[s]}
                </span>
              </button>
            ))}
          </div>

          {/* Extra Filters */}
          <div className="flex items-center gap-3 mb-5 flex-wrap">
            <select
              value={productCategoryFilter}
              onChange={(e) => setProductCategoryFilter(e.target.value)}
              className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-white text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="全部">全部产品</option>
              {PRODUCT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-white text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="全部">全部优先级</option>
              <option value="高">高优先级</option>
              <option value="中">中优先级</option>
              <option value="低">低优先级</option>
            </select>
            <select
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value)}
              className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-white text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="全部">全部客户</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {(productCategoryFilter !== '全部' || priorityFilter !== '全部' || customerFilter !== '全部') && (
              <button
                onClick={() => { setProductCategoryFilter('全部'); setPriorityFilter('全部'); setCustomerFilter('全部') }}
                className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1"
              >
                <X size={13} />
                清除筛选
              </button>
            )}
          </div>

          {/* Requirements List */}
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <InboxIcon size={40} className="mb-3 text-slate-200" />
              <p className="text-base">暂无需求记录</p>
              <button
                onClick={openNewModal}
                className="mt-3 text-blue-500 text-sm hover:underline"
              >
                记录第一条需求
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((req) => (
                <div
                  key={req.id}
                  onClick={() => setSelectedReq(req)}
                  className={`bg-white rounded-xl border shadow-sm p-4 cursor-pointer hover:shadow-md transition-all ${
                    selectedReq?.id === req.id
                      ? 'border-blue-400 ring-2 ring-blue-100'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <div
                          className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_CONFIG[req.status]?.dot}`}
                        />
                        <h3 className="font-medium text-slate-800 text-sm leading-snug line-clamp-1">
                          {req.title}
                        </h3>
                      </div>
                      <div className="flex items-center flex-wrap gap-1.5 mb-2">
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <User size={11} />
                          {getCustomerName(req.customerId)}
                        </span>
                        <span className="text-slate-300">·</span>
                        <span className="text-xs text-slate-400">{req.source}</span>
                        {req.productCategory && (
                          <>
                            <span className="text-slate-300">·</span>
                            <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${PRODUCT_CATEGORY_COLORS[req.productCategory] || 'bg-slate-100 text-slate-500'}`}>
                              {req.productCategory}
                            </span>
                          </>
                        )}
                        {req.tags && req.tags.map((tag) => (
                          <span
                            key={tag}
                            className={`text-xs px-1.5 py-0.5 rounded font-medium ${TAG_COLORS[tag] || 'bg-slate-100 text-slate-500'}`}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-1">{req.content}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <div className="flex items-center gap-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_CONFIG[req.status]?.badge}`}>
                          {req.status}
                        </span>
                        <button
                          onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(req.id) }}
                          className="p-1 rounded hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_BADGE[req.priority]}`}>
                        {req.priority}
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock size={11} />
                        {formatTime(req.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detail Panel */}
      {selectedReq && (
        <div className="w-96 flex-shrink-0 flex flex-col bg-white overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_CONFIG[selectedReq.status]?.dot}`} />
              <h2 className="font-semibold text-slate-800 text-sm truncate">
                {selectedReq.title}
              </h2>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0 ml-2">
              <button
                onClick={() => openEditModal(selectedReq)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-blue-500 transition-colors"
                title="编辑需求"
              >
                <Pencil size={15} />
              </button>
              <button
                onClick={() => setSelectedReq(null)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* Meta Info */}
            <div className="px-5 py-4 border-b border-slate-100 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_CONFIG[selectedReq.status]?.badge}`}>
                  {selectedReq.status}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_BADGE[selectedReq.priority]}`}>
                  {selectedReq.priority}优先级
                </span>
                {selectedReq.productCategory && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRODUCT_CATEGORY_COLORS[selectedReq.productCategory] || 'bg-slate-100 text-slate-500'}`}>
                    {selectedReq.productCategory}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-y-2 text-sm">
                <div>
                  <div className="text-xs text-slate-400 mb-0.5">来源客户</div>
                  <div className="text-slate-700 text-xs font-medium">{getCustomerName(selectedReq.customerId)}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 mb-0.5">需求来源</div>
                  <div className="text-slate-700 text-xs font-medium">{selectedReq.source}</div>
                </div>
                {selectedReq.deadline && (
                  <div>
                    <div className="text-xs text-slate-400 mb-0.5">截止日期</div>
                    <div className="text-slate-700 text-xs font-medium">{selectedReq.deadline}</div>
                  </div>
                )}
                <div>
                  <div className="text-xs text-slate-400 mb-0.5">记录时间</div>
                  <div className="text-slate-700 text-xs">{new Date(selectedReq.createdAt).toLocaleDateString('zh-CN')}</div>
                </div>
              </div>
              {selectedReq.tags && selectedReq.tags.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Tag size={12} className="text-slate-400" />
                  {selectedReq.tags.map((tag) => (
                    <span
                      key={tag}
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${TAG_COLORS[tag] || 'bg-slate-100 text-slate-500'}`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="px-5 py-4 border-b border-slate-100">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">需求内容</h4>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{selectedReq.content}</p>
            </div>

            {/* AI Summary */}
            {selectedReq.aiSummary && (
              <div className="px-5 py-4 border-b border-slate-100">
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Sparkles size={13} className="text-blue-500" />
                    <span className="text-xs font-semibold text-blue-700">AI 分析摘要</span>
                  </div>
                  <p className="text-xs text-blue-800 leading-relaxed">{selectedReq.aiSummary}</p>
                </div>
              </div>
            )}

            {/* File Attachments */}
            {(selectedReq.fileUrl || selectedReq.fileName) && (
              <div className="px-5 py-4 border-b border-slate-100">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">附件</h4>
                {selectedReq.fileUrl && (
                  <a
                    href={selectedReq.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-600 hover:underline break-all block mb-1"
                  >
                    {selectedReq.fileUrl}
                  </a>
                )}
                {selectedReq.fileName && !selectedReq.fileUrl && (
                  <p className="text-xs text-slate-600">{selectedReq.fileName}</p>
                )}
              </div>
            )}

            {/* Status Actions */}
            <div className="px-5 py-4 border-b border-slate-100">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">状态变更</h4>
              <div className="flex flex-wrap gap-2">
                {['待评审', '开发中', '已上线', '已拒绝', '已暂停'].map((s) => (
                  <button
                    key={s}
                    onClick={() => handleStatusChange(selectedReq.id, s)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium border transition-all ${
                      selectedReq.status === s
                        ? `${STATUS_CONFIG[s]?.badge} border-current`
                        : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Task */}
            <div className="px-5 py-4">
              <button
                onClick={() => handleGenerateTask(selectedReq)}
                disabled={generatingTask}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                {generatingTask ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    正在生成任务…
                  </>
                ) : (
                  <>
                    <Sparkles size={15} />
                    生成任务到工作计划
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Requirement Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 flex-shrink-0">
              <h3 className="text-lg font-semibold text-slate-800">{editingReq ? '编辑需求' : '记录需求'}</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  需求标题 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="简短描述需求主题"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Product Category */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  产品分类 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.productCategory}
                  onChange={(e) => setFormData({ ...formData, productCategory: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">请选择产品分类</option>
                  {PRODUCT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Customer + Source */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">来源客户</label>
                  <select
                    value={formData.customerId}
                    onChange={(e) => {
                      const cid = e.target.value
                      const customer = customers.find((c) => c.id === cid)
                      setFormData({
                        ...formData,
                        customerId: cid,
                        productCategory: customer?.productCategory || formData.productCategory,
                      })
                    }}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">未关联客户</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">需求来源</label>
                  <input
                    type="text"
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    placeholder="如：微信、会议…"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  需求内容 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="详细描述需求背景、目标、期望效果…"
                  rows={4}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* AI Analyze Button */}
              <button
                onClick={handleAiAnalyze}
                disabled={aiAnalyzing || !formData.content.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-purple-50 hover:bg-purple-100 disabled:bg-slate-50 text-purple-700 disabled:text-slate-400 border border-purple-200 disabled:border-slate-200 rounded-lg text-sm font-medium transition-colors w-full justify-center"
              >
                {aiAnalyzing ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    AI 分析中…
                  </>
                ) : (
                  <>
                    <Sparkles size={15} />
                    AI 智能分析
                  </>
                )}
              </button>

              {/* AI Result */}
              {aiResult && (
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Sparkles size={13} className="text-blue-500" />
                    <span className="text-xs font-semibold text-blue-700">AI 分析结果</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-blue-600 font-medium">建议优先级：</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_BADGE[aiResult.priority]}`}>
                      {aiResult.priority}
                    </span>
                  </div>
                  <div className="flex items-center flex-wrap gap-1.5">
                    <span className="text-xs text-blue-600 font-medium">建议标签：</span>
                    {aiResult.tags.map((tag) => (
                      <span key={tag} className={`text-xs px-1.5 py-0.5 rounded ${TAG_COLORS[tag] || 'bg-slate-100 text-slate-500'}`}>
                        {tag}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-blue-800 leading-relaxed">{aiResult.summary}</p>
                </div>
              )}

              {/* Tags (manual) */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  需求标签
                  <span className="text-xs text-slate-400 ml-1 font-normal">（可多选）</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(TAG_COLORS).map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`text-xs px-3 py-1 rounded-full border font-medium transition-all ${
                        formData.tags.includes(tag)
                          ? `${TAG_COLORS[tag]} border-current`
                          : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Priority + Deadline */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">优先级</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="高">高</option>
                    <option value="中">中</option>
                    <option value="低">低</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">截止日期</label>
                  <input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Status — 仅编辑时显示 */}
              {editingReq && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">需求状态</label>
                  <div className="flex gap-2 flex-wrap">
                    {['待评审', '开发中', '已上线', '已拒绝', '已暂停'].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setFormData({ ...formData, status: s })}
                        className={`text-xs px-3 py-1.5 rounded-lg font-medium border transition-all ${
                          formData.status === s
                            ? `${STATUS_CONFIG[s]?.badge} border-current`
                            : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* File Attachments */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  文件地址
                  <span className="text-xs text-slate-400 ml-1 font-normal">（选填）</span>
                </label>
                <input
                  type="text"
                  value={formData.fileUrl}
                  onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
                  placeholder="粘贴文件链接或路径…"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  上传文件
                  <span className="text-xs text-slate-400 ml-1 font-normal">（选填，仅记录文件名）</span>
                </label>
                <input
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) setFormData((prev) => ({ ...prev, fileName: file.name }))
                  }}
                  className="w-full text-sm text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {formData.fileName && (
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    已选：{formData.fileName}
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, fileName: '' }))}
                      className="text-slate-400 hover:text-red-500"
                    >
                      <X size={12} />
                    </button>
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 flex-shrink-0">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSaveRequirement}
                disabled={!formData.title.trim() || !formData.content.trim() || !formData.productCategory}
                className="px-5 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-lg font-medium transition-colors"
              >
                {editingReq ? '保存修改' : '保存需求'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={20} className="text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">确认删除</h3>
                <p className="text-sm text-slate-500 mt-0.5">需求删除后不可恢复</p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  )
}
