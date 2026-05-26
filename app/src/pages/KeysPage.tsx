import { useEffect, useState } from 'react'
import { Copy, Eye, EyeOff, Pencil, Plus, Trash2 } from 'lucide-react'
import { EditKeyQuotaModal } from '../components/EditKeyQuotaModal'
import { PageHeader } from '../components/PageHeader'
import { CreateKeyModal, type CreateKeyParams } from '../components/CreateKeyModal'
import {
  createKeyRequest,
  deleteKeyRequest,
  getKeysRequest,
  getKeyValueRequest,
  getPricingRequest,
  updateKeyRequest,
} from '../apiClient'
import { formatPricingGroupName } from '../pricingGroups'
import type { ApiKeyItem, PricingSummary } from '../types'

function formatQuotaLabel(item: ApiKeyItem) {
  if (item.unlimitedQuota) return '不限额度'
  return `$${(item.remainQuotaUsd ?? 0).toFixed(2)}`
}

function formatUsedQuotaLabel(item: ApiKeyItem) {
  return `$${(item.usedQuotaUsd ?? 0).toFixed(2)}`
}

export function KeysPage() {
  const [keys, setKeys] = useState<ApiKeyItem[]>([])
  const [pricing, setPricing] = useState<PricingSummary | null>(null)
  const [revealed, setRevealed] = useState<Record<string, boolean>>({})
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingKey, setEditingKey] = useState<ApiKeyItem | null>(null)
  const [tip, setTip] = useState('')
  const [newKeyValue, setNewKeyValue] = useState('')
  const [error, setError] = useState('')
  const [loadingKeyId, setLoadingKeyId] = useState('')

  useEffect(() => {
    void (async () => {
      try {
        const [result, pricingResult] = await Promise.all([
          getKeysRequest(),
          getPricingRequest().catch(() => null),
        ])
        setKeys(result)
        setPricing(pricingResult)
      } catch (err) {
        setError(err instanceof Error ? err.message : '获取 API Key 失败')
      }
    })()
  }, [])

  const refresh = async () => {
    const result = await getKeysRequest()
    setKeys(result)
  }

  const copyText = async (value: string, message = 'Key 已复制到剪贴板') => {
    await navigator.clipboard.writeText(value)
    setTip(message)
    window.setTimeout(() => setTip(''), 1500)
  }

  const handleCreateKey = async (params: CreateKeyParams) => {
    const result = await createKeyRequest(params.name, params)
    setNewKeyValue(result.value)
    await refresh()
    setTip('API Key 创建成功，请立即复制并妥善保存。')
    window.setTimeout(() => setTip(''), 5000)
  }

  const handleUpdateKey = async (params: {
    id: string
    name: string
    unlimited_quota: boolean
    remain_quota: number
    expired_time: number
    group_id?: string
  }) => {
    await updateKeyRequest(params)
    await refresh()
    setTip('额度已更新')
    window.setTimeout(() => setTip(''), 3000)
  }

  const toggleReveal = async (item: ApiKeyItem) => {
    if (revealed[item.id]) {
      setRevealed((current) => ({
        ...current,
        [item.id]: false,
      }))
      return
    }

    setLoadingKeyId(item.id)
    setError('')
    try {
      const result = await getKeyValueRequest(item.id)
      setKeys((current) =>
        current.map((key) =>
          key.id === item.id
            ? {
                ...key,
                value: result.key,
              }
            : key,
        ),
      )
      setRevealed((current) => ({
        ...current,
        [item.id]: true,
      }))
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取完整 API Key 失败')
    } finally {
      setLoadingKeyId('')
    }
  }

  return (
    <div className="page">
      <PageHeader
        title="API Keys"
        description=""
      />

      {error ? <div className="alert error">{error}</div> : null}

      <section className="panel-card">
        <div className="section-head">
          <h2>创建新 Key</h2>
        </div>

        <button className="primary-button" onClick={() => setShowCreateModal(true)}>
          <Plus size={16} />
          <span>创建密钥</span>
        </button>
        {tip ? <div className="inline-tip success">{tip}</div> : null}
      </section>

      {showCreateModal ? (
        <CreateKeyModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateKey}
          pricing={pricing}
        />
      ) : null}

      {editingKey ? (
        <EditKeyQuotaModal
          item={editingKey}
          pricing={pricing}
          onClose={() => setEditingKey(null)}
          onSave={handleUpdateKey}
        />
      ) : null}

      {newKeyValue ? (
        <div className="modal-overlay" onClick={() => setNewKeyValue('')}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>新密钥已生成</h2>
            </div>
            <div className="modal-body">
              <p>请立即复制完整 Key。关闭后前端不会再次展示完整值。</p>
              <div className="key-display">
                <code>{newKeyValue}</code>
                <button
                  className="primary-button"
                  onClick={() => copyText(newKeyValue, '新密钥已复制')}
                >
                  <Copy size={16} />
                  <span>复制</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <section className="panel-card">
        <div className="section-head">
          <h2>已有 Key</h2>
        </div>
        {keys.length === 0 ? (
          <div className="empty-state">你还没有创建 API Key。</div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>名称</th>
                  <th>分组</th>
                  <th>API Key</th>
                  <th>剩余额度</th>
                  <th>已用额度</th>
                  <th>创建时间</th>
                  <th>最后使用</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {keys.map((item) => {
                  const visible = revealed[item.id]
                  const displayValue = visible
                    ? item.value
                    : `${item.value.slice(0, 10)}...${item.value.slice(-6)}`

                  return (
                    <tr key={item.id}>
                      <td>{item.name}</td>
                      <td>{item.groupId ? formatPricingGroupName(item.groupId) : '-'}</td>
                      <td className="mono key-cell">{displayValue}</td>
                      <td>{formatQuotaLabel(item)}</td>
                      <td>{formatUsedQuotaLabel(item)}</td>
                      <td>{item.createdAt}</td>
                      <td>{item.lastUsedAt}</td>
                      <td>
                        <span className={`status-badge ${item.status}`}>
                          {item.status === 'active' ? '正常' : '已停用'}
                        </span>
                      </td>
                      <td>
                        <div className="table-actions">
                          <button
                            className="icon-button"
                            title="调整额度"
                            onClick={() => setEditingKey(item)}
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            className="icon-button"
                            title={visible ? '隐藏' : '显示'}
                            onClick={() => toggleReveal(item)}
                            disabled={loadingKeyId === item.id}
                          >
                            {visible ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                          <button
                            className="icon-button"
                            title="复制"
                            onClick={() => copyText(item.value)}
                          >
                            <Copy size={16} />
                          </button>
                          <button
                            className="icon-button danger"
                            title="删除"
                            onClick={async () => {
                              if (confirm(`确定删除密钥“${item.name}”吗？此操作不可恢复。`)) {
                                await deleteKeyRequest(item.id)
                                await refresh()
                              }
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
