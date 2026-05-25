import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { X } from 'lucide-react'
import {
  derivePricingGroupOptions,
  fallbackPricingGroupOptions,
  formatPricingGroupRatio,
  type PricingGroupOption,
} from '../pricingGroups'
import type { ApiKeyItem, PricingSummary } from '../types'

type EditKeyQuotaModalProps = {
  item: ApiKeyItem
  pricing?: PricingSummary | null
  onClose: () => void
  onSave: (params: {
    id: string
    name: string
    unlimited_quota: boolean
    remain_quota: number
    expired_time: number
    group_id?: string
  }) => Promise<void>
}

function groupSummaryLabel(group: PricingGroupOption) {
  return group.name
}

export function EditKeyQuotaModal({ item, pricing, onClose, onSave }: EditKeyQuotaModalProps) {
  const groupOptions = useMemo(() => {
    const derived = derivePricingGroupOptions(pricing)
    return derived.length > 0 ? derived : fallbackPricingGroupOptions
  }, [pricing])

  const [unlimitedQuota, setUnlimitedQuota] = useState(Boolean(item.unlimitedQuota))
  const [quotaUsd, setQuotaUsd] = useState(item.remainQuotaUsd ?? 0)
  const [groupId, setGroupId] = useState(item.groupId ?? groupOptions[0]?.id ?? '')
  const [expireDays, setExpireDays] = useState(() => {
    if (!item.expiredTime || item.expiredTime <= 0) return 0
    const now = Math.floor(Date.now() / 1000)
    const diff = item.expiredTime - now
    return diff > 0 ? Math.ceil(diff / (24 * 60 * 60)) : 0
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!groupOptions.length) return
    if (!groupOptions.some((group) => group.id === groupId)) {
      setGroupId(item.groupId ?? groupOptions[0].id)
    }
  }, [groupId, groupOptions, item.groupId])

  const selectedGroup = useMemo(
    () => groupOptions.find((group) => group.id === groupId) ?? groupOptions[0],
    [groupId, groupOptions],
  )

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      await onSave({
        id: item.id,
        name: item.name,
        unlimited_quota: unlimitedQuota,
        remain_quota: unlimitedQuota ? 0 : Math.round(quotaUsd * 500000),
        expired_time: expireDays > 0 ? Math.floor(Date.now() / 1000) + expireDays * 24 * 60 * 60 : -1,
        group_id: groupId || undefined,
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新 Key 失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h2>编辑 Key</h2>
          <button className="icon-button" onClick={onClose} title="关闭">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {error ? <div className="error-message">{error}</div> : null}

          <div className="form-group">
            <label>额度模式</label>
            <div className="radio-group">
              <label className="radio-option">
                <input
                  type="radio"
                  checked={unlimitedQuota}
                  onChange={() => setUnlimitedQuota(true)}
                  disabled={loading}
                />
                <span>不限额度</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  checked={!unlimitedQuota}
                  onChange={() => setUnlimitedQuota(false)}
                  disabled={loading}
                />
                <span>自定义额度</span>
              </label>
            </div>
          </div>

          {!unlimitedQuota ? (
            <div className="form-group">
              <label htmlFor="editQuota">剩余额度（USD）</label>
              <input
                id="editQuota"
                type="number"
                value={quotaUsd}
                onChange={(e) => setQuotaUsd(Math.max(0, Number.parseFloat(e.target.value || '0')))}
                disabled={loading}
                step="0.01"
                min="0"
              />
              <div className="form-group-hint">这里设置的是这把 Key 当前还可继续消耗的额度。</div>
            </div>
          ) : null}

          <div className="form-group">
            <label htmlFor="editGroupId">倍率分组</label>
            <select
              id="editGroupId"
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              disabled={loading}
            >
              {groupOptions.map((group) => (
                <option key={group.id} value={group.id}>
                  {groupSummaryLabel(group)}
                </option>
              ))}
            </select>
            {selectedGroup ? (
              <div className="form-group-hint">
                当前为 {selectedGroup.family} 分组，覆盖 {selectedGroup.modelCount} 个模型系列，按模型基础价格的{' '}
                {formatPricingGroupRatio(selectedGroup.ratio)} 计费。
              </div>
            ) : null}
            {selectedGroup?.modelNames?.length ? (
              <div className="group-chip-row">
                {selectedGroup.modelNames.slice(0, 6).map((modelName) => (
                  <span key={modelName} className="group-model-chip">
                    {modelName}
                  </span>
                ))}
                {selectedGroup.modelNames.length > 6 ? (
                  <span className="group-model-chip muted">
                    +{selectedGroup.modelNames.length - 6}
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="form-group">
            <label htmlFor="editExpireDays">有效期（天）</label>
            <input
              id="editExpireDays"
              type="number"
              value={expireDays || ''}
              onChange={(e) => setExpireDays(Math.max(0, Number.parseInt(e.target.value || '0', 10)))}
              placeholder="留空或 0 表示不过期"
              disabled={loading}
              min="0"
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="secondary-button" onClick={onClose} disabled={loading}>
              取消
            </button>
            <button type="submit" className="primary-button" disabled={loading}>
              {loading ? '保存中...' : '保存修改'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
