import { useState, type FormEvent } from 'react'
import { X } from 'lucide-react'
import type { ApiKeyItem } from '../types'

type EditKeyQuotaModalProps = {
  item: ApiKeyItem
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

export function EditKeyQuotaModal({ item, onClose, onSave }: EditKeyQuotaModalProps) {
  const [unlimitedQuota, setUnlimitedQuota] = useState(Boolean(item.unlimitedQuota))
  const [quotaUsd, setQuotaUsd] = useState(item.remainQuotaUsd ?? 0)
  const [expireDays, setExpireDays] = useState(() => {
    if (!item.expiredTime || item.expiredTime <= 0) return 0
    const now = Math.floor(Date.now() / 1000)
    const diff = item.expiredTime - now
    return diff > 0 ? Math.ceil(diff / (24 * 60 * 60)) : 0
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
        group_id: item.groupId,
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新额度失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>调整额度</h2>
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
              <div className="form-group-hint">这里设置的是这把 Key 当前还可以继续消耗的额度。</div>
            </div>
          ) : null}

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
              {loading ? '保存中...' : '保存额度'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
