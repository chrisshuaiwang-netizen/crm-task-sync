import { useState } from 'react'
import {
  Plus,
  Search,
  Users,
  Phone,
  X,
  Pencil,
  Trash2,
  FileText,
  ClipboardList,
  ChevronRight,
  AlertTriangle,
  Layers,
} from 'lucide-react'
import useStore from '../store/useStore'

export const PRODUCT_CATEGORIES = [
  'DAM',
  '开放平台-国内标准版',
  '开放平台-海外标准版',
  '私有化部署',
  'B TO C合作',
]

export const PRODUCT_CATEGORY_COLORS = {
  'DAM': 'bg-blue-100 text-blue-700',
  '开放平台-国内标准版': 'bg-purple-100 text-purple-700',
  '开放平台-海外标准版': 'bg-indigo-100 text-indigo-700',
  '私有化部署': 'bg-orange-100 text-orange-700',
  'B TO C合作': 'bg-teal-100 text-teal-700',
}

const PRIORITY_BADGE = {
  高: 'bg-red-100 text-red-700 border border-red-200',
  中: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
  低: 'bg-green-100 text-green-700 border border-green-200',
}

const PRIORITY_DOT = {
  高: 'bg-red-500',
  中: 'bg-yellow-500',
  低: 'bg-green-500',
}

const INDUSTRY_COLORS = {
  金融科技: 'bg-blue-100 text-blue-700',
  大数据: 'bg-purple-100 text-purple-700',
  零售电商: 'bg-orange-100 text-orange-700',
  物流科技: 'bg-teal-100 text-teal-700',
  医疗健康: 'bg-pink-100 text-pink-700',
  教育科技: 'bg-indigo-100 text-indigo-700',
  企业服务: 'bg-cyan-100 text-cyan-700',
  其他: 'bg-slate-100 text-slate-600',
}

const REQ_STATUS_BADGE = {
  待评审: 'bg-yellow-100 text-yellow-700',
  开发中: 'bg-blue-100 text-blue-700',
  已上线: 'bg-green-100 text-green-700',
  已拒绝: 'bg-red-100 text-red-700',
  已暂停: 'bg-gray-100 text-gray-600',
}

const TASK_STATUS_BADGE = {
  待处理: 'bg-slate-100 text-slate-600',
  进行中: 'bg-blue-100 text-blue-700',
  已完成: 'bg-green-100 text-green-700',
}

const defaultForm = {
  name: '',
  industry: '其他',
  priority: '中',
  contact: '',
  phone: '',
  notes: '',
  productCategory: PRODUCT_CATEGORIES[0],
}

const INDUSTRIES = ['金融科技', '大数据', '零售电商', '物流科技', '医疗健康', '教育科技', '企业服务', '其他']

export default function Customers() {
  const { customers, requirements, tasks, addCustomer, updateCustomer, deleteCustomer } = useStore()

  const [search, setSearch] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('全部')
  const [productCategoryFilter, setProductCategoryFilter] = useState('全部')
  const [showModal, setShowModal] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [formData, setFormData] = useState(defaultForm)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [detailTab, setDetailTab] = useState('需求列表')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null)

  const PRIORITY_ORDER = { 高: 0, 中: 1, 低: 2 }

  const baseFiltered = customers
    .filter((c) => {
      const matchSearch =
        c.name.includes(search) ||
        (c.contact && c.contact.includes(search)) ||
        (c.industry && c.industry.includes(search))
      const matchPriority = priorityFilter === '全部' || c.priority === priorityFilter
      const matchCategory = productCategoryFilter === '全部' || c.productCategory === productCategoryFilter
      return matchSearch && matchPriority && matchCategory
    })
    .sort((a, b) => {
      const pd = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
      if (pd !== 0) return pd
      return new Date(b.createdAt) - new Date(a.createdAt)
    })

  // Group by productCategory
  const categoriesToShow = productCategoryFilter === '全部' ? PRODUCT_CATEGORIES : [productCategoryFilter]

  // Customers that have no known productCategory
  const uncategorized = baseFiltered.filter(
    (c) => !c.productCategory || !PRODUCT_CATEGORIES.includes(c.productCategory)
  )

  function openNewModal() {
    setEditingCustomer(null)
    setFormData(defaultForm)
    setShowModal(true)
  }

  function openEditModal(customer) {
    setEditingCustomer(customer)
    setFormData({
      name: customer.name,
      industry: customer.industry,
      priority: customer.priority,
      contact: customer.contact,
      phone: customer.phone,
      notes: customer.notes || '',
      productCategory: customer.productCategory || PRODUCT_CATEGORIES[0],
    })
    setShowModal(true)
  }

  function handleSave() {
    if (!formData.name.trim()) return
    if (editingCustomer) {
      updateCustomer(editingCustomer.id, formData)
      if (selectedCustomer && selectedCustomer.id === editingCustomer.id) {
        setSelectedCustomer({ ...selectedCustomer, ...formData })
      }
    } else {
      addCustomer(formData)
    }
    setShowModal(false)
  }

  function handleDelete(id) {
    deleteCustomer(id)
    setShowDeleteConfirm(null)
    if (selectedCustomer && selectedCustomer.id === id) {
      setSelectedCustomer(null)
    }
  }

  function openDetail(customer) {
    setSelectedCustomer(customer)
    setDetailTab('需求列表')
  }

  const customerReqs = selectedCustomer
    ? requirements.filter((r) => r.customerId === selectedCustomer.id)
    : []

  const customerTasks = selectedCustomer
    ? tasks.filter((t) => t.customerId === selectedCustomer.id)
    : []

  function getReqCount(customerId) {
    return requirements.filter((r) => r.customerId === customerId).length
  }

  function CustomerCard({ customer }) {
    return (
      <div
        onClick={() => openDetail(customer)}
        className={`bg-white rounded-xl border shadow-sm p-4 cursor-pointer hover:shadow-md transition-all ${
          selectedCustomer?.id === customer.id
            ? 'border-blue-400 ring-2 ring-blue-100'
            : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-0.5 ${PRIORITY_DOT[customer.priority]}`} />
            <h3 className="font-semibold text-slate-800 text-sm leading-snug line-clamp-1">{customer.name}</h3>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0 ml-2">
            <button
              onClick={(e) => { e.stopPropagation(); openEditModal(customer) }}
              className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <Pencil size={13} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(customer.id) }}
              className="p-1.5 rounded-md hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${INDUSTRY_COLORS[customer.industry] || INDUSTRY_COLORS['其他']}`}>
            {customer.industry}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_BADGE[customer.priority]}`}>
            {customer.priority}优先级
          </span>
        </div>

        <div className="space-y-1.5 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Users size={12} className="text-slate-400" />
            <span>{customer.contact}</span>
          </div>
          {customer.phone && (
            <div className="flex items-center gap-1.5">
              <Phone size={12} className="text-slate-400" />
              <span>{customer.phone}</span>
            </div>
          )}
        </div>

        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <FileText size={12} />
            <span>{getReqCount(customer.id)} 条需求</span>
          </div>
          <ChevronRight size={14} className="text-slate-300" />
        </div>
      </div>
    )
  }

  const hasAnyCustomers = baseFiltered.length > 0 || uncategorized.length > 0

  return (
    <div className="flex h-screen">
      {/* Main area */}
      <div className={`flex-1 min-w-0 flex flex-col ${selectedCustomer ? 'border-r border-slate-200' : ''}`}>
        <div className="p-6 flex-1 overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">客户管理</h1>
              <p className="text-slate-500 text-sm mt-0.5">共 {customers.length} 位客户</p>
            </div>
            <button
              onClick={openNewModal}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <Plus size={16} />
              新增客户
            </button>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3 mb-5 flex-wrap">
            <div className="relative flex-1 min-w-[160px] max-w-xs">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="搜索客户名、联系人、行业…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            {/* Product category filter */}
            <select
              value={productCategoryFilter}
              onChange={(e) => setProductCategoryFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="全部">全部产品</option>
              {PRODUCT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            {/* Priority filter */}
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1">
              {['全部', '高', '中', '低'].map((p) => (
                <button
                  key={p}
                  onClick={() => setPriorityFilter(p)}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    priorityFilter === p
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Grouped Customer List */}
          {!hasAnyCustomers ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Users size={40} className="mb-3 text-slate-200" />
              <p className="text-base">暂无客户数据</p>
              <button onClick={openNewModal} className="mt-3 text-blue-500 text-sm hover:underline">
                添加第一个客户
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {categoriesToShow.map((cat) => {
                const catCustomers = baseFiltered.filter((c) => c.productCategory === cat)
                if (catCustomers.length === 0 && productCategoryFilter === '全部') return null
                return (
                  <div key={cat}>
                    {/* Section Header */}
                    <div className="flex items-center gap-2 mb-3">
                      <Layers size={15} className="text-slate-400" />
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${PRODUCT_CATEGORY_COLORS[cat]}`}>
                        {cat}
                      </span>
                      <span className="text-xs text-slate-400">{catCustomers.length} 位客户</span>
                      <div className="flex-1 h-px bg-slate-100 ml-1" />
                    </div>
                    {catCustomers.length === 0 ? (
                      <p className="text-xs text-slate-300 pl-6 pb-2">暂无客户</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {catCustomers.map((customer) => (
                          <CustomerCard key={customer.id} customer={customer} />
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
              {/* Uncategorized */}
              {uncategorized.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Layers size={15} className="text-slate-400" />
                    <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-slate-100 text-slate-500">
                      未分类
                    </span>
                    <span className="text-xs text-slate-400">{uncategorized.length} 位客户</span>
                    <div className="flex-1 h-px bg-slate-100 ml-1" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {uncategorized.map((customer) => (
                      <CustomerCard key={customer.id} customer={customer} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Detail Panel */}
      {selectedCustomer && (
        <div className="w-96 flex-shrink-0 flex flex-col bg-white overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800 text-base truncate">{selectedCustomer.name}</h2>
            <button
              onClick={() => setSelectedCustomer(null)}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Customer Info */}
          <div className="px-5 py-4 border-b border-slate-100 space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              {selectedCustomer.productCategory && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRODUCT_CATEGORY_COLORS[selectedCustomer.productCategory] || 'bg-slate-100 text-slate-500'}`}>
                  {selectedCustomer.productCategory}
                </span>
              )}
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${INDUSTRY_COLORS[selectedCustomer.industry] || INDUSTRY_COLORS['其他']}`}>
                {selectedCustomer.industry}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_BADGE[selectedCustomer.priority]}`}>
                {selectedCustomer.priority}优先级
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <div className="text-xs text-slate-400 mb-0.5">联系人</div>
                <div className="text-slate-700 font-medium">{selectedCustomer.contact}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400 mb-0.5">联系电话</div>
                <div className="text-slate-700">{selectedCustomer.phone || '—'}</div>
              </div>
            </div>
            {selectedCustomer.notes && (
              <div>
                <div className="text-xs text-slate-400 mb-0.5">备注</div>
                <p className="text-sm text-slate-600 leading-relaxed">{selectedCustomer.notes}</p>
              </div>
            )}
            <button
              onClick={() => openEditModal(selectedCustomer)}
              className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 transition-colors"
            >
              <Pencil size={12} />
              编辑客户信息
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-100">
            {['需求列表', '关联任务'].map((tab) => (
              <button
                key={tab}
                onClick={() => setDetailTab(tab)}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  detailTab === tab
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab}
                <span className="ml-1.5 text-xs">
                  ({tab === '需求列表' ? customerReqs.length : customerTasks.length})
                </span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto">
            {detailTab === '需求列表' && (
              <div className="divide-y divide-slate-50">
                {customerReqs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                    <FileText size={28} className="mb-2 text-slate-200" />
                    <p className="text-sm">暂无需求记录</p>
                  </div>
                ) : (
                  customerReqs.map((req) => (
                    <div key={req.id} className="px-5 py-3.5">
                      <div className="flex items-start gap-2">
                        <p className="text-sm font-medium text-slate-800 flex-1 leading-snug">{req.title}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 font-medium ${REQ_STATUS_BADGE[req.status]}`}>
                          {req.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className={`text-xs px-1.5 py-0.5 rounded ${PRIORITY_BADGE[req.priority]}`}>
                          {req.priority}
                        </span>
                        {req.productCategory && (
                          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${PRODUCT_CATEGORY_COLORS[req.productCategory] || 'bg-slate-100 text-slate-500'}`}>
                            {req.productCategory}
                          </span>
                        )}
                        {req.tags && req.tags.slice(0, 1).map((tag) => (
                          <span key={tag} className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {detailTab === '关联任务' && (
              <div className="divide-y divide-slate-50">
                {customerTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                    <ClipboardList size={28} className="mb-2 text-slate-200" />
                    <p className="text-sm">暂无关联任务</p>
                  </div>
                ) : (
                  customerTasks.map((task) => (
                    <div key={task.id} className="px-5 py-3.5">
                      <div className="flex items-start gap-2">
                        <p className={`text-sm font-medium flex-1 leading-snug ${task.status === '已完成' ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                          {task.title}
                        </p>
                        <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 font-medium ${TASK_STATUS_BADGE[task.status]}`}>
                          {task.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-400">
                        <span>{task.date}</span>
                        <span>·</span>
                        <span>{task.hours}h</span>
                        <span className={`px-1.5 py-0.5 rounded ${PRIORITY_BADGE[task.priority]}`}>{task.priority}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* New/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 flex-shrink-0">
              <h3 className="text-lg font-semibold text-slate-800">
                {editingCustomer ? '编辑客户' : '新增客户'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  公司名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="请输入公司名称"
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
                  {PRODUCT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">所属行业</label>
                  <select
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    {INDUSTRIES.map((ind) => (
                      <option key={ind} value={ind}>{ind}</option>
                    ))}
                  </select>
                </div>
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
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">联系人</label>
                  <input
                    type="text"
                    value={formData.contact}
                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                    placeholder="联系人姓名"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">联系电话</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="手机号码"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">备注</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="客户背景、沟通记录等…"
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
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
                onClick={handleSave}
                disabled={!formData.name.trim()}
                className="px-5 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-lg font-medium transition-colors"
              >
                {editingCustomer ? '保存修改' : '创建客户'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={20} className="text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">确认删除</h3>
                <p className="text-sm text-slate-500 mt-0.5">此操作不可恢复，请谨慎操作</p>
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
    </div>
  )
}
