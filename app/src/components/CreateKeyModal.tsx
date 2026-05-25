import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { X } from 'lucide-react'
import {
  derivePricingGroupOptions,
  fallbackPricingGroupOptions,
  formatPricingGroupRatio,
  type PricingGroupOption,
} from '../pricingGroups'
import type { PricingSummary } from '../types'

interface CreateKeyModalProps {
  onClose: () => void
  onCreate: (params: CreateKeyParams) => Promise<void>
  pricing?: PricingSummary | null
}

export interface CreateKeyParams {
  name: string
  models?: string[]
  unlimited_quota?: boolean
  remain_quota?: number
  expired_time?: number
  group_id?: string
}

function groupSummaryLabel(group: PricingGroupOption) {
  return group.name
}

export function CreateKeyModal({ onClose, onCreate, pricing }: CreateKeyModalProps) {
  const groupOptions = useMemo(() => {
    const derived = derivePricingGroupOptions(pricing)
    return derived.length > 0 ? derived : fallbackPricingGroupOptions
  }, [pricing])
  const [name, setName] = useState('')
  const [unlimitedQuota, setUnlimitedQuota] = useState(true)
  const [quota, setQuota] = useState(500000)
  const [expireDays, setExpireDays] = useState(0)
  const [groupId, setGroupId] = useState(groupOptions[0]?.id ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!groupOptions.length) return
    if (!groupOptions.some((group) => group.id === groupId)) {
      setGroupId(groupOptions[0].id)
    }
  }, [groupId, groupOptions])

  const selectedGroup = useMemo(
    () => groupOptions.find((group) => group.id === groupId) ?? groupOptions[0],
    [groupId, groupOptions],
  )

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('请输入密钥名称')
      return
    }

    setLoading(true)

    try {
      const params: CreateKeyParams = {
        name: name.trim(),
        unlimited_quota: unlimitedQuota,
        group_id: groupId || undefined,
      }

      if (!unlimitedQuota) {
        params.remain_quota = quota
      }

      if (expireDays > 0) {
        params.expired_time = Math.floor(Date.now() / 1000) + expireDays * 24 * 60 * 60
      }

      await onCreate(params)
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '创建失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>创建 API Key</h2>
          <button className="icon-button" onClick={onClose} title="关闭">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {error ? <div className="error-message">{error}</div> : null}

          <div className="form-group">
            <label htmlFor="keyName">密钥名称</label>
            <input
              id="keyName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：MacBook、测试环境、运营账号"
              disabled={loading}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="groupId">倍率分组</label>
            <select
              id="groupId"
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
              <label htmlFor="quota">额度（USD）</label>
              <input
                id="quota"
                type="number"
                value={quota / 500000}
                onChange={(e) =>
                  setQuota(Math.max(0, Number.parseFloat(e.target.value || '0')) * 500000)
                }
                placeholder="0"
                disabled={loading}
                step="0.01"
                min="0"
              />
              <div className="form-group-hint">按当前换算，1 美元约等于 500,000 配额单位。</div>
            </div>
          ) : null}

          <div className="form-group">
            <label htmlFor="expireDays">有效期（天）</label>
            <input
              id="expireDays"
              type="number"
              value={expireDays || ''}
              onChange={(e) =>
                setExpireDays(Math.max(0, Number.parseInt(e.target.value || '0', 10)))
              }
              placeholder="留空或 0 表示不过期"
              disabled={loading}
              min="0"
            />
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
              disabled={loading}
            >
              取消
            </button>
            <button type="submit" className="primary-button" disabled={loading}>
              {loading ? '创建中...' : '创建密钥'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
